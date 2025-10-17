#!/usr/bin/env bash
# gitlabhq 새 태그 감시 → Discord Embed 카드로 알림

REPO_TAG_FEED="https://gitlab.com/gitlab-org/gitlab-foss/-/tags?format=atom"
CACHE_FILE="$HOME/.last_gitlab_tags"
DISCORD_URL="$DISCORD_URL"

if [ -z $DISCORD_URL ]; then
    echo 'Please set DISCORD_URL first, to use this script.' >&2
    exit 1
fi

# 최근 1개 태그 추출
LATEST_TAGS=$(curl -s "$REPO_TAG_FEED" \
  | grep "<title>" \
  | sed 's/.*<title>\(.*\)<\/title>.*/\1/' \
  | grep -viE '(rc|tags|from|gitlabhq)' \
  | head -n 1)

echo -e "=== (DEBUG) RESULT TAGS ===\n$LATEST_TAGS"

# 캐시 파일 없으면 초기화
[ ! -f "$CACHE_FILE" ] && touch "$CACHE_FILE"

for TAG in $LATEST_TAGS; do
  if ! grep -qx "$TAG" "$CACHE_FILE"; then
    echo "🆕 New stable tag: $TAG"

    GITLAB_URL="https://gitlab.com/gitlab-org/gitlab-foss/-/releases/$TAG"
    DOCKER_URL="https://hub.docker.com/layers/gitlab/gitlab-ce/${TAG}"

    # Discord Embed JSON 생성
    JSON_PAYLOAD=$(jq -n \
      --arg title "🟢 New GitLab CE Release: $TAG" \
      --arg gitlab "$GITLAB_URL" \
      --arg docker "$DOCKER_URL" \
      '{
        "embeds": [{
          "title": $title,
          "color": 3066993,
          "fields": [
            {"name": "🔗 GitLab Tag", "value": $gitlab, "inline": false},
            {"name": "🐳 Docker Image", "value": $docker, "inline": false}
          ],
          "footer": {"text": "GitLab CE Tag Monitor"},
          "timestamp": (now | todate)
        }]
      }'
    )

    # 전송
    curl -s -H "Content-Type: application/json" \
         -X POST \
         -d "$JSON_PAYLOAD" \
         "$DISCORD_URL" >/dev/null

    echo "$TAG" >> "$CACHE_FILE"
  fi
done

