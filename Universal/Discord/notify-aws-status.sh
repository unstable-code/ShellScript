#!/usr/bin/env bash
# AWS 상태 RSS 감시 → Discord Embed 카드로 알림

AP_REGION=${AP_REGION:-us-east-1}

REPO_TAG_FEED="https://status.aws.amazon.com/rss/multipleservices-$AP_REGION.rss"
CACHE_FILE="$HOME/.$(echo "$DISCORD_URL" | sed 's/https:\/\/discord.com\/api\/webhooks\///' | awk -F '/' '{ print $1 }')"
DISCORD_URL="${DISCORD_URL:-}"

if [ -z "$DISCORD_URL" ]; then
    echo 'Please set DISCORD_URL to use this script.' >&2
    exit 1
fi

# 캐시 파일 없으면 초기화
[ ! -f "$CACHE_FILE" ] && touch "$CACHE_FILE"

# RSS에서 item 추출 (title, link, pubDate, guid)
curl -s "$REPO_TAG_FEED" \
    | awk '
      /<item>/ {item=1; title=""; link=""; pubDate=""; guid=""}
      /<\/item>/ {item=0; print title "|" link "|" pubDate "|" guid}
      item && /<title>/ {match($0, /<title><!\[CDATA\[(.*)\]\]><\/title>/, a); title=a[1]}
      item && /<link>/ {match($0, /<link>(.*)<\/link>/, a); link=a[1]}
      item && /<pubDate>/ {match($0, /<pubDate>(.*)<\/pubDate>/, a); pubDate=a[1]}
      item && /<guid/ {match($0, /<guid.*>(.*)<\/guid>/, a); guid=a[1]}
    ' | while IFS="|" read -r title link pubDate guid; do

    # 이미 캐시에 있으면 스킵
    if ! grep -qx "$guid" "$CACHE_FILE"; then
        echo "🆕 New AWS Status: $title"

        # Discord Embed JSON 생성
        JSON_PAYLOAD=$(jq -n \
            --arg title "⚠️ AWS Service Update" \
            --arg status "$title" \
            --arg link "$link" \
            --arg pubDate "$pubDate" \
            '{
              "embeds": [{
                "title": $title,
                "color": 16753920,
                "fields": [
                  {"name": "Status", "value": $status, "inline": false},
                  {"name": "Link", "value": $link, "inline": false},
                  {"name": "Published", "value": $pubDate, "inline": false}
                ],
                "footer": {"text": "AWS Status Monitor"},
                "timestamp": ($pubDate | strptime("%a, %d %b %Y %H:%M:%S %Z") | strftime("%Y-%m-%dT%H:%M:%SZ"))
              }]
            }'
        )

        # 전송
        curl -s -H "Content-Type: application/json" \
             -X POST \
             -d "$JSON_PAYLOAD" \
             "$DISCORD_URL" >/dev/null

        # 캐시에 기록
        echo "$guid" >> "$CACHE_FILE"
    fi
done

