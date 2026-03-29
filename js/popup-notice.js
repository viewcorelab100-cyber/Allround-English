/**
 * 사용자 공지 팝업 표시
 * - Supabase popup_notices 테이블에서 활성 팝업 조회
 * - "오늘 하루 보지 않기" localStorage 지원
 * - 텍스트/이미지 모드 자동 전환
 * - admin 페이지에서는 동작하지 않음
 */
(function () {
    // admin 페이지 제외
    if (location.pathname.includes('admin')) return;

    // Supabase 준비 대기
    function waitForSupabase(cb, tries) {
        if (window.supabase) return cb();
        if (tries <= 0) return;
        setTimeout(function () { waitForSupabase(cb, tries - 1); }, 200);
    }

    waitForSupabase(async function () {
        try {
            var now = new Date();
            var { data, error } = await window.supabase
                .from('popup_notices')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error || !data || data.length === 0) return;

            // 한국시간 기준 날짜 비교
            var today = new Date(Date.now() + 9 * 3600000).toISOString().split('T')[0];
            var active = data.filter(function (n) {
                var startOnly = n.start_date ? n.start_date.split('T')[0] : null;
                var endOnly = n.end_date ? n.end_date.split('T')[0] : null;
                if (startOnly && startOnly > today) return false;
                if (endOnly && endOnly < today) return false;
                return true;
            });

            // "오늘 하루 보지 않기" 필터링
            var visible = active.filter(function (n) {
                return !localStorage.getItem('popup_dismiss_' + n.id + '_' + today);
            });

            if (visible.length === 0) return;

            // 순차 표시 (첫 번째부터)
            showPopup(visible, 0);
        } catch (e) {
            console.error('Popup notice error:', e);
        }
    }, 25);

    function showPopup(list, idx) {
        if (idx >= list.length) return;
        var n = list[idx];

        // 오버레이
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';

        // 팝업 컨테이너
        var popup = document.createElement('div');
        popup.style.cssText = 'background:#fff;border-radius:16px;max-width:400px;width:100%;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

        // 헤더 (제목 + 닫기)
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:20px 24px 12px;flex-shrink:0;';

        var title = document.createElement('h3');
        title.style.cssText = 'font-size:18px;font-weight:700;color:#111;margin:0;line-height:1.4;font-family:"Pretendard Variable","Noto Sans KR",sans-serif;';
        title.textContent = n.title;

        var closeBtn = document.createElement('button');
        closeBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;color:#999;font-size:20px;line-height:1;';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function () {
            document.body.removeChild(overlay);
            showPopup(list, idx + 1);
        };

        header.appendChild(title);
        header.appendChild(closeBtn);
        popup.appendChild(header);

        // 본문
        var body = document.createElement('div');
        body.style.cssText = 'padding:0 24px 16px;overflow-y:auto;flex:1;';

        if (n.notice_type === 'image' && n.image_url) {
            var img = document.createElement('img');
            img.src = n.image_url;
            img.alt = n.title;
            img.style.cssText = 'width:100%;border-radius:8px;display:block;';
            body.appendChild(img);
            if (n.content) {
                var cap = document.createElement('p');
                cap.style.cssText = 'margin-top:12px;font-size:14px;color:#555;line-height:1.7;font-family:"Pretendard Variable","Noto Sans KR",sans-serif;';
                cap.textContent = n.content;
                body.appendChild(cap);
            }
        } else {
            if (n.content) {
                var text = document.createElement('p');
                text.style.cssText = 'font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;font-family:"Pretendard Variable","Noto Sans KR",sans-serif;';
                text.textContent = n.content;
                body.appendChild(text);
            }
        }

        popup.appendChild(body);

        // 푸터 (오늘 하루 보지 않기 + 닫기)
        var footer = document.createElement('div');
        footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 24px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;';

        var dismissBtn = document.createElement('button');
        dismissBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:13px;color:#999;padding:0;font-family:"Pretendard Variable","Noto Sans KR",sans-serif;';
        dismissBtn.textContent = '오늘 하루 보지 않기';
        dismissBtn.onclick = function () {
            var todayStr = new Date().toISOString().split('T')[0];
            localStorage.setItem('popup_dismiss_' + n.id + '_' + todayStr, '1');
            document.body.removeChild(overlay);
            showPopup(list, idx + 1);
        };

        var confirmBtn = document.createElement('button');
        confirmBtn.style.cssText = 'background:#111;color:#fff;border:none;cursor:pointer;font-size:14px;font-weight:600;padding:8px 24px;border-radius:8px;font-family:"Pretendard Variable","Noto Sans KR",sans-serif;';
        confirmBtn.textContent = '확인';
        confirmBtn.onclick = function () {
            document.body.removeChild(overlay);
            showPopup(list, idx + 1);
        };

        footer.appendChild(dismissBtn);
        footer.appendChild(confirmBtn);
        popup.appendChild(footer);

        overlay.appendChild(popup);

        // 오버레이 클릭으로 닫기 (팝업 외부)
        overlay.onclick = function (e) {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                showPopup(list, idx + 1);
            }
        };

        document.body.appendChild(overlay);
    }
})();
