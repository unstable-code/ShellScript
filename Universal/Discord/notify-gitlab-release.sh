#!/usr/bin/env bash
# GitLab 공식 릴리즈 피드 감시 → Discord Embed 카드로 알림

REPO_FEED="https://about.gitlab.com/all-releases.xml"
DISCORD_URL="${DISCORD_URL:-}"

if [ -z "$DISCORD_URL" ]; then
    echo 'Please set DISCORD_URL to use this script.' >&2
    exit 1
fi

# 캐시 파일명을 Discord webhook ID로 생성
CACHE_FILE="$HOME/.$(echo "$DISCORD_URL" | sed 's|https://discord.com/api/webhooks/||' | awk -F '/' '{ print $1 }')"

# 캐시 파일 없으면 초기화
[ ! -f "$CACHE_FILE" ] && touch "$CACHE_FILE"

# 피드 가져오기
FEED_CONTENT=$(curl -s "$REPO_FEED")

# 최신 entry 추출 (첫 번째 entry만)
LATEST_ENTRY=$(echo "$FEED_CONTENT" | awk '/<entry>/,/<\/entry>/' | head -50)

# 피드 ID에서 슬러그만 추출 (URL 마지막 부분)
FEED_ID=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<id>)[^<]+' | head -1 | sed 's|.*/\([^/]*\)/$|\1|')
TITLE=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<title>)[^<]+' | head -1)
LINK=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<link href=.)[^'"'"'"]+' | head -1)
PUBLISHED=$(echo "$LATEST_ENTRY" | grep -oP '(?<=<published>)[^<]+' | head -1)

echo "=== (DEBUG) Latest Release ==="
echo "ID: $FEED_ID"
echo "Title: $TITLE"

# 이미 알림한 피드인지 확인
if grep -qxF "$FEED_ID" "$CACHE_FILE"; then
    echo "Already notified. Skipping."
    exit 0
fi

echo "New release detected!"

# 릴리즈 타입 판별 및 description 생성
if echo "$TITLE" | grep -q "Patch Release"; then
    # 패치 릴리즈: CVE 목록 추출
    RELEASE_TYPE="patch"
    EMBED_COLOR=15158332  # 빨간색 (보안)

    # 첫 번째 entry의 content만 추출 (더 넓은 범위)
    ENTRY_CONTENT=$(echo "$FEED_CONTENT" | awk '/<entry>/,/<\/entry>/' | head -400)

    # CVE 추출 (중복 제거)
    CVE_LIST=$(echo "$ENTRY_CONTENT" | grep -oE 'CVE-[0-9]+-[0-9]+' | sort -u | head -8)

    # 버그 수정 내용 추출
    BUG_FIXES=$(echo "$ENTRY_CONTENT" \
        | grep -oP "(?:Backport[^<]*?|^)Fix[^<\"']*" \
        | sed "s/&#x27;/'/g; s/&quot;/\"/g; s/Backport[^F]*//; s/&lt;.*//; s/'$//; s/\"$//; s/\"//g; s/ into .*//; s/^ *//" \
        | sort -u | head -5)

    DESCRIPTION=""

    # CVE 섹션
    if [ -n "$CVE_LIST" ]; then
        DESCRIPTION=$'**Security Fixes:**\n'
        while IFS= read -r cve; do
            DESCRIPTION+="• [$cve](https://www.cve.org/CVERecord?id=$cve)"$'\n'
        done <<< "$CVE_LIST"
    fi

    # 버그 수정 섹션
    if [ -n "$BUG_FIXES" ]; then
        DESCRIPTION+=$'\n**Bug Fixes:**\n'
        while IFS= read -r fix; do
            DESCRIPTION+="• ${fix}"$'\n'
        done <<< "$BUG_FIXES"
    fi

    # 둘 다 없으면 기본 메시지
    if [ -z "$DESCRIPTION" ]; then
        DESCRIPTION="Bug fixes and improvements"
    fi
else
    # 일반 릴리즈: "with" 뒤의 개선사항 추출
    RELEASE_TYPE="major"
    EMBED_COLOR=3066993  # 초록색

    FEATURES=$(echo "$TITLE" | sed -n 's/.*released with \(.*\)/\1/p')
    if [ -n "$FEATURES" ]; then
        DESCRIPTION=$'**Highlights:**\n'"• ${FEATURES}"
    else
        DESCRIPTION="New GitLab release"
    fi
fi

# 버전 추출 (제목에서 모든 버전)
VERSIONS=$(echo "$TITLE" | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?')

echo "Type: $RELEASE_TYPE"
echo "Versions: $(echo $VERSIONS | tr '\n' ' ')"
echo -e "Description: $DESCRIPTION"

# Docker 링크 목록 생성
DOCKER_LINKS=""
while IFS= read -r ver; do
    url="https://hub.docker.com/r/gitlab/gitlab-ce/tags?name=${ver}"
    DOCKER_LINKS+="• [v${ver}](${url})"$'\n'
done <<< "$VERSIONS"

# Discord Embed JSON 생성
JSON_PAYLOAD=$(jq -n \
    --arg title "$TITLE" \
    --arg url "$LINK" \
    --arg desc "$DESCRIPTION" \
    --argjson color "$EMBED_COLOR" \
    --arg timestamp "$PUBLISHED" \
    --arg docker "$DOCKER_LINKS" \
    '{
      "embeds": [{
        "title": $title,
        "url": $url,
        "description": $desc,
        "color": $color,
        "fields": [
          {"name": "🐳 Docker Images", "value": $docker, "inline": false}
        ],
        "footer": {"text": "GitLab Release Monitor"},
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
