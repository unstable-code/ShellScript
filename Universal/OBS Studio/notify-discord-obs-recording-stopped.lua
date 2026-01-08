obs = obslua

-- 사용자 설정
settings = {
    webhook_url = "",
    message_text = "🎬 OBS 녹화가 종료되었습니다!",
}

-- 녹화 시작 시 저장할 정보
recording_info = {
    title = nil,
}

-----------------------------------------------------------
-- 설명
function script_description()
    return "녹화 종료 시 디스코드에 메시지를 전송합니다.\n녹화 시작 시 playerctl의 미디어 제목을 저장하여 종료 메시지에 포함합니다.\n테스트 버튼으로 확인도 가능합니다."
end

-- 사용자 설정 UI
function script_properties()
    local props = obs.obs_properties_create()
    obs.obs_properties_add_text(props, "webhook_url", "디스코드 웹훅 URL", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_text(props, "message_text", "보낼 메시지", obs.OBS_TEXT_DEFAULT)

    -- 테스트 버튼 추가
    obs.obs_properties_add_button(props, "test_button", "💬 테스트 메시지 전송", on_test_button_pressed)

    return props
end

-- 설정 업데이트
function script_update(settings_ref)
    settings.webhook_url = obs.obs_data_get_string(settings_ref, "webhook_url")
    settings.message_text = obs.obs_data_get_string(settings_ref, "message_text")
    settings.message_text = (settings.message_text ~= nil and settings.message_text ~= "") and settings.message_text or "🎬 OBS 녹화가 종료되었습니다!"
end

-- playerctl에서 현재 재생 중인 미디어 제목 가져오기
function get_playerctl_title()
    local handle = io.popen("playerctl metadata title 2>/dev/null")
    if handle then
        local result = handle:read("*a")
        handle:close()
        if result and result ~= "" then
            return result:gsub("%s+$", "") -- 후행 공백/개행 제거
        end
    end
    return nil
end

-- 녹화 시작/종료 감지
function on_event(event)
    if event == obs.OBS_FRONTEND_EVENT_RECORDING_STARTED then
        recording_info.title = get_playerctl_title()
        if recording_info.title then
            print("[OBS Discord Notify] 녹화 시작 - 저장된 제목: " .. recording_info.title)
        else
            print("[OBS Discord Notify] 녹화 시작 - 재생 중인 미디어 없음")
        end
    elseif event == obs.OBS_FRONTEND_EVENT_RECORDING_STOPPED then
        local message = settings.message_text
        if recording_info.title then
            message = message .. "\n📺 " .. recording_info.title
        end
        send_discord_notification(message)
        recording_info.title = nil -- 초기화
    end
end

-- 메시지 전송 함수
function send_discord_notification(message)
    if settings.webhook_url == "" then
        print("[OBS Discord Notify] 웹훅 URL이 비어 있습니다.")
        return
    end

    local safe_message = message:gsub('"', '\\"')
    local command = string.format(
        'curl -s -H "Content-Type: application/json" -X POST -d \'{"content": "%s"}\' "%s"',
        safe_message,
        settings.webhook_url
    )

    print("[OBS Discord Notify] 등록된 웹훅 URL로 메시지를 전송합니다: " .. safe_message)
    os.execute(command)
end

-- 테스트 버튼 눌렀을 때 실행
function on_test_button_pressed(props, prop)
    print("[OBS Discord Notify] 테스트 메시지 전송 중...")
    send_discord_notification("[테스트] 이 메시지는 OBS 스크립트에서 전송되었습니다.")
    return true
end

-- 스크립트 로드 시
function script_load(settings_ref)
    obs.obs_frontend_add_event_callback(on_event)
end

