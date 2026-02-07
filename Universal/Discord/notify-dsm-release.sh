#!/usr/bin/env bash

BASE_URL="https://archive.synology.com/download/Os/DSM"
NAS_MODEL="${NAS_MODEL:-$(cat /proc/sys/kernel/syno_hw_version)}"
DISCORD_URL="${DISCORD_URL:-}"
LOCK_FILE="$HOME/.$(echo "$DISCORD_URL" | sed 's/https:\/\/discord.com\/api\/webhooks\///' | awk -F '/' '{ print $1 }')"

if [ -z "$DISCORD_URL" ]; then
    echo 'Please set DISCORD_URL first.' >&2
    exit 1
fi

if [ -z "$NAS_MODEL" ]; then
    echo 'Please set NAS_MODEL first.' >&2
    # shellcheck disable=SC2016
    echo 'ex. `export NAS_MODEL=DS918+`' >&2
    exit 1
fi

#####################################
# 최신 DSM 버전 가져오기
#####################################
LATEST_PATH=$(curl -s "$BASE_URL" \
    | grep -oP '/download/Os/DSM/\d+\.\d+\.\d+-\d+' \
    | head -n1)

[ -z "$LATEST_PATH" ] && exit 0

LATEST=$(basename "$LATEST_PATH")  # 예: 7.3.1-86003
VERSION_PAGE="https://archive.synology.com${LATEST_PATH}"

BUILD=$(echo "$LATEST" | cut -d- -f2)

#####################################
# Lock 파일 확인
#####################################
if [ -f "$LOCK_FILE" ]; then
    OLD_VERSION=$(cat "$LOCK_FILE")
    if [ "$OLD_VERSION" = "$LATEST" ]; then
        # 이미 처리한 버전 → 종료
        exit 0
    fi
fi

#####################################
# 모델 지원 여부 확인
#####################################
HTML=$(curl -s "$VERSION_PAGE")

FILE_PATTERN="DSM_${NAS_MODEL//+/%2B}_${BUILD}.pat"
DOWNLOAD_URL=$(echo "$HTML" | grep -oP "https://[^']*${FILE_PATTERN}" | head -n1)

# ❗ 지원되지 않으면 아무것도 하지 않고 종료
if [ -z "$DOWNLOAD_URL" ]; then
    exit 0
fi

#####################################
# Discord Embed JSON 생성
#####################################
COLOR=3066993  # 초록색 (지원됨)

JSON=$(jq -n \
    --arg title "🟢 New DSM Release: $LATEST" \
    --arg model "$NAS_MODEL" \
    --arg download "$DOWNLOAD_URL" \
    --arg url "$VERSION_PAGE" \
    --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --argjson color "$COLOR" \
    '{
        embeds: [{
            title: $title,
            url: $url,
            color: $color,
            fields: [
                {name: "🗘 NAS Model", value: $model, inline: true},
                {name: "🔗 Download", value: $download, inline: false}
            ],
            footer: {text: "Synology DSM Monitor"},
            timestamp: $timestamp
        }]
    }'
)

#####################################
# Webhook 전송
#####################################
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$JSON" \
    "$DISCORD_URL"

#####################################
# Lock 파일 업데이트 (지원되는 경우만)
#####################################
echo "$LATEST" > "$LOCK_FILE"

