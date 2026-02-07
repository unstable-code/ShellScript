#!/usr/bin/env bash
# GitLab Runner 릴리즈 피드 감시 → Discord Embed 카드로 알림

GITLAB_FEED_TOKEN="${GITLAB_FEED_TOKEN:-}"
DISCORD_URL="${DISCORD_URL:-}"

if [ -z "$GITLAB_FEED_TOKEN" ]; then
    echo 'Please set GITLAB_FEED_TOKEN to use this script.' >&2
    exit 1
fi

if [ -z "$DISCORD_URL" ]; then
    echo 'Please set DISCORD_URL to use this script.' >&2
    exit 1
fi

REPO_FEED="https://gitlab.com/gitlab-org/gitlab-runner/-/releases.atom?feed_token=${GITLAB_FEED_TOKEN}"

# 캐시 파일명을 Discord webhook ID로 생성 (기존 GitLab 알림과 구분)
WEBHOOK_ID=$(echo "$DISCORD_URL" | sed 's|https://discord.com/api/webhooks/||' | awk -F '/' '{ print $1 }')
CACHE_FILE="$HOME/.${WEBHOOK_ID}-runner"

# 캐시 파일 없으면 초기화
[ ! -f "$CACHE_FILE" ] && touch "$CACHE_FILE"

# 피드 가져오기
FEED_CONTENT=$(curl -s "$REPO_FEED")

# 최신 entry 추출 (첫 번째 entry만)
LATEST_ENTRY=$(echo "$FEED_CONTENT" | awk '/<entry>/,/<\/entry>/' | head -50)

# 피드 메타데이터 추출
FEED_ID=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<id>)[^<]+' | head -1)
TITLE=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<title>)[^<]+' | head -1)
LINK=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<link href=.)[^'"'"'"]+' | head -1)
PUBLISHED=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<published>)[^<]+' | head -1)

echo "=== (DEBUG) Latest Runner Release ==="
echo "ID: $FEED_ID"
echo "Title: $TITLE"

# 이미 알림한 피드인지 확인
if grep -qxF "$FEED_ID" "$CACHE_FILE"; then
    echo "Already notified. Skipping."
    exit 0
fi

echo "New release detected!"

# 버전 추출 (v18.8.0 → 18.8.0)
VERSION=$(echo "$TITLE" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
PATCH=$(echo "$VERSION" | awk -F '.' '{ print $3 }')

# 릴리즈 타입 판별
if [ "$PATCH" != "0" ]; then
    RELEASE_TYPE="patch"
    EMBED_COLOR=15105570  # 주황색 (패치)
    DESCRIPTION="Bug fixes and improvements"
else
    RELEASE_TYPE="minor"
    EMBED_COLOR=3066993  # 초록색 (마이너/메이저)
    DESCRIPTION="New GitLab Runner release"
fi

echo "Type: $RELEASE_TYPE"
echo "Version: $VERSION"

# CHANGELOG 링크
CHANGELOG_URL="https://gitlab.com/gitlab-org/gitlab-runner/blob/${TITLE}/CHANGELOG.md"

# Docker 링크
DOCKER_URL="https://hub.docker.com/r/gitlab/gitlab-runner/tags?name=${VERSION}"

# Discord Embed JSON 생성
JSON_PAYLOAD=$(jq -n \
    --arg title "GitLab Runner $TITLE" \
    --arg url "$LINK" \
    --arg desc "$DESCRIPTION" \
    --argjson color "$EMBED_COLOR" \
    --arg timestamp "$PUBLISHED" \
    --arg changelog "[CHANGELOG.md](${CHANGELOG_URL})" \
    --arg docker "[v${VERSION}](${DOCKER_URL})" \
    '{
      "embeds": [{
        "title": $title,
        "url": $url,
        "description": $desc,
        "color": $color,
        "fields": [
          {"name": "📋 Changelog", "value": $changelog, "inline": true},
          {"name": "🐳 Docker Image", "value": $docker, "inline": true}
        ],
        "footer": {"text": "GitLab Runner Release Monitor"},
        "timestamp": $timestamp
      }]
    }'
)

# 전송
echo "=== Sending to Discord ==="
echo "$JSON_PAYLOAD" | jq .

RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" \
     -X POST \
     -d "$JSON_PAYLOAD" \
     "$DISCORD_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "Successfully sent! (HTTP $HTTP_CODE)"
    echo "$FEED_ID" > "$CACHE_FILE"
else
    echo "Failed to send (HTTP $HTTP_CODE): $BODY" >&2
    exit 1
fi
