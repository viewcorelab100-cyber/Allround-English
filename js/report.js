// report.js - 학습 리포트 로직

document.addEventListener('DOMContentLoaded', async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.js:DOMContentLoaded',message:'Report page loaded',data:{url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('id');       // 내부 관리용 ID
    const publicId = params.get('pid');      // 외부 공유용 ID (Public ID)

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.js:params',message:'Report params',data:{reportId,publicId,hasReportId:!!reportId,hasPublicId:!!publicId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    if (!reportId && !publicId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'report.js:noparams',message:'No report params - showing error',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        showError();
        return;
    }

    await loadReport(reportId, publicId);
});

async function loadReport(reportId, publicId) {
    const loadingEl = document.getElementById('loading');
    const contentEl = document.getElementById('report-content');
    
    try {
        let query = window.supabase
            .from('course_reports')
            .select('*');

        // ID 타입에 따라 쿼리 조건 설정
        if (publicId) {
            query = query.eq('public_id', publicId);
        } else {
            query = query.eq('id', reportId);
        }

        const { data, error } = await query.single();

        if (error || !data) throw error;

        // 데이터 바인딩
        renderReport(data);

        // 쿠폰 발급 (완강 리포트인 경우에만)
        if (data.user_id && data.course_id) {
            await issueCoupon(data.user_id, data.course_id);
        }

        // 추천 강의 로드
        if (data.course_id) {
            await loadRecommendedCourses(data.course_id);
        }

        // 로딩 숨김, 컨텐츠 표시
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

    } catch (error) {
        console.error('Report load error:', error);
        showError();
    }
}

function renderReport(data) {
    // 1. 텍스트 정보 바인딩
    document.getElementById('student-name').textContent = data.student_name || '학생';
    document.getElementById('course-title').textContent = data.course_title || '과정';
    document.getElementById('report-date').textContent = new Date(data.created_at).toLocaleDateString('ko-KR');
    
    document.getElementById('total-lessons').textContent = data.total_lessons;
    document.getElementById('completed-lessons').textContent = data.completed_lessons;
    
    document.getElementById('progress-text').textContent = `${data.total_progress}%`;
    document.getElementById('assignment-text').textContent = `${data.assignment_rate}%`;
    
    document.getElementById('watch-rate').textContent = `${data.average_watch_rate}%`;
    // 과제 수는 역산하거나 별도 저장 필요 (여기선 예시로 계산)
    const assignmentCount = Math.round((data.assignment_rate / 100) * data.total_lessons);
    document.getElementById('assignment-count').textContent = `${assignmentCount}개`;

    // 코멘트 (없으면 기본 메시지 유지)
    if (data.instructor_comment) {
        document.getElementById('instructor-comment').textContent = data.instructor_comment;
    }

    // 2. 차트 렌더링
    initCharts(data.total_progress, data.assignment_rate);
}

function initCharts(progress, assignmentRate) {
    // 공통 옵션
    const chartOptions = {
        cutout: '80%', // 도넛 두께
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        }
    };

    // 진도율 차트
    new Chart(document.getElementById('progressChart'), {
        type: 'doughnut',
        data: {
            labels: ['완료', '미완료'],
            datasets: [{
                data: [progress, 100 - progress],
                backgroundColor: ['#ffffff', 'rgba(255, 255, 255, 0.1)'],
                borderWidth: 0
            }]
        },
        options: chartOptions
    });

    // 숙제율 차트
    new Chart(document.getElementById('assignmentChart'), {
        type: 'doughnut',
        data: {
            labels: ['완료', '미완료'],
            datasets: [{
                data: [assignmentRate, 100 - assignmentRate],
                backgroundColor: ['#fbbf24', 'rgba(255, 255, 255, 0.1)'], // yellow-400
                borderWidth: 0
            }]
        },
        options: chartOptions
    });
}

function showError() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error-message').classList.remove('hidden');
}

// 완강 쿠폰 발급
async function issueCoupon(userId, courseId) {
    try {
        // RPC 함수 호출하여 쿠폰 발급
        const { data, error } = await window.supabase
            .rpc('issue_completion_coupon', {
                p_user_id: userId,
                p_course_id: courseId
            });

        if (error) {
            console.error('Coupon issue error:', error);
            // 쿠폰 발급 실패해도 리포트는 보여줌
            document.getElementById('coupon-code').textContent = '발급 실패';
            return;
        }

        // 발급된 쿠폰 정보 표시
        if (data) {
            // 발급된 쿠폰 상세 정보 가져오기
            const { data: couponData, error: couponError } = await window.supabase
                .from('user_coupons')
                .select(`
                    *,
                    coupons (
                        code,
                        name,
                        discount_value
                    )
                `)
                .eq('id', data)
                .single();

            if (couponData && couponData.coupons) {
                document.getElementById('coupon-code').textContent = couponData.coupons.code;
            } else {
                document.getElementById('coupon-code').textContent = 'COMPLETION15';
            }
        } else {
            // 이미 발급된 쿠폰인 경우
            document.getElementById('coupon-code').textContent = '이미 발급됨';
            
            // 쿠폰 섹션 스타일 변경
            const couponSection = document.getElementById('coupon-section');
            couponSection.classList.remove('from-yellow-500', 'to-orange-500');
            couponSection.classList.add('from-gray-600', 'to-gray-700');
        }
    } catch (error) {
        console.error('Issue coupon error:', error);
        document.getElementById('coupon-code').textContent = '발급 실패';
    }
}

// 추천 강의 로드
async function loadRecommendedCourses(currentCourseId) {
    const container = document.getElementById('recommended-courses');
    
    try {
        // 현재 강의와 같은 카테고리의 다른 강의 가져오기
        const { data: currentCourse } = await window.supabase
            .from('courses')
            .select('categories')
            .eq('id', currentCourseId)
            .single();

        if (!currentCourse) {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full">추천 강의가 없습니다.</p>';
            return;
        }

        // 같은 카테고리의 강의 중 최신 2개 가져오기
        const { data: courses, error } = await window.supabase
            .from('courses')
            .select(`
                id,
                title,
                subtitle,
                thumbnail_url,
                price,
                categories,
                lessons (id)
            `)
            .eq('is_published', true)
            .neq('id', currentCourseId)
            .order('created_at', { ascending: false })
            .limit(2);

        if (error) throw error;

        if (!courses || courses.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full">추천 강의가 없습니다.</p>';
            return;
        }

        // 추천 강의 카드 렌더링
        container.innerHTML = courses.map(course => `
            <div class="bg-white bg-opacity-5 rounded-2xl overflow-hidden hover:bg-opacity-10 transition-all cursor-pointer" onclick="window.location.href='course-detail.html?id=${course.id}'">
                <div class="aspect-video bg-gray-800 relative overflow-hidden">
                    ${course.thumbnail_url 
                        ? `<img src="${course.thumbnail_url}" alt="${course.title}" class="w-full h-full object-cover">`
                        : '<div class="w-full h-full flex items-center justify-center text-gray-600 text-4xl">📚</div>'
                    }
                </div>
                <div class="p-6 space-y-3">
                    <div class="flex items-center space-x-2">
                        ${course.categories && course.categories.length > 0 
                            ? course.categories.map(cat => `<span class="text-xs px-2 py-1 bg-white bg-opacity-10 rounded-full text-gray-300">${cat}</span>`).join('')
                            : ''
                        }
                    </div>
                    <h4 class="text-lg font-bold text-white line-clamp-2">${course.title}</h4>
                    ${course.subtitle 
                        ? `<p class="text-sm text-gray-400 line-clamp-2">${course.subtitle}</p>`
                        : ''
                    }
                    <div class="flex items-center justify-between pt-2">
                        <span class="text-white font-bold text-lg">${course.price ? `₩${course.price.toLocaleString()}` : '무료'}</span>
                        <span class="text-sm text-gray-400">${course.lessons?.length || 0}개 레슨</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Load recommended courses error:', error);
        container.innerHTML = '<p class="text-red-400 text-center col-span-full">추천 강의를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 마이페이지 쿠폰 탭으로 이동
function goToMyPageCoupons() {
    window.location.href = 'mypage.html?tab=coupons';
}












