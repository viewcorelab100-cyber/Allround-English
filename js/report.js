// report.js - 학습 리포트 로직

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('id');       // 내부 관리용 ID
    const publicId = params.get('pid');      // 외부 공유용 ID (Public ID)

    if (!reportId && !publicId) {
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

    // 코멘트 자동 생성
    const comment = generateTeacherComment(data.average_watch_rate, data.assignment_rate, data.total_progress);
    document.getElementById('instructor-comment').textContent = comment;

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
            console.error('Coupon issue error');
            // 쿠폰 발급 실패해도 리포트는 보여줌
            const couponCodeEl = document.getElementById('coupon-code');
            if (couponCodeEl) couponCodeEl.textContent = '발급 실패: ' + (error.message || '알 수 없는 오류');
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

            if (couponData) {
                // 고유 쿠폰 코드 표시 (custom_code 우선, 없으면 기본 코드)
                const displayCode = couponData.custom_code || couponData.coupons?.code || 'COMPLETE-ERR';
                document.getElementById('coupon-code').textContent = displayCode;
            } else {
                document.getElementById('coupon-code').textContent = '발급 오류';
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
        console.log('[추천 강의] 시작, currentCourseId:', currentCourseId);
        
        // 현재 강의와 같은 카테고리의 다른 강의 가져오기
        const { data: currentCourse, error: courseError } = await window.supabase
            .from('courses')
            .select('category')
            .eq('id', currentCourseId)
            .single();
        
        console.log('[추천 강의] 현재 강의 쿼리 결과:', { currentCourse, courseError });
        
        if (courseError) {
            console.error('[추천 강의] 현재 강의 조회 에러:', courseError);
        }

        // currentCourse가 없으면 카테고리 필터링 없이 진행
        const hasCategory = currentCourse && currentCourse.category;

        // 현재 사용자 가져오기
        const user = window.currentUser || (await window.supabase.auth.getUser()).data.user;
        console.log('[추천 강의] 현재 사용자:', user?.id);
        
        // 사용자가 이미 구매한 강의 목록 가져오기
        let purchasedCourseIds = [currentCourseId]; // 현재 강의는 제외
        if (user) {
            const { data: purchases } = await window.supabase
                .from('purchases')
                .select('course_id')
                .eq('user_id', user.id);
            console.log('[추천 강의] 구매한 강의 목록:', purchases);
            if (purchases && purchases.length > 0) {
                purchasedCourseIds = [...purchasedCourseIds, ...purchases.map(p => p.course_id)];
            }
        }
        console.log('[추천 강의] 제외할 강의 IDs:', purchasedCourseIds);

        // 1단계: 같은 카테고리의 안 들은 강의 추천 (카테고리 정보가 있을 때만)
        let courses = null;
        let error = null;
        
        if (hasCategory) {
            console.log('[추천 강의] 1단계: 같은 카테고리 강의 찾기');
            let query = window.supabase
                .from('courses')
                .select('id, title, thumbnail_url, price, category, lessons (id)')
                .eq('is_published', true);
            
            // 구매한 강의 제외
            if (purchasedCourseIds.length > 0) {
                query = query.not('id', 'in', `(${purchasedCourseIds.join(',')})`);
            }
            
            query = query
                .eq('category', currentCourse.category)
                .order('created_at', { ascending: false })
                .limit(2);
            
            const result = await query;
            courses = result.data;
            error = result.error;
            
            console.log('[추천 강의] 1단계 (같은 카테고리) 쿼리 결과:', { courses, error });
        } else {
            console.log('[추천 강의] 카테고리 정보 없음, 1단계 스킵');
        }

        if (error) {
            console.error('[추천 강의] 1단계 에러:', error);
        }

        // 2단계: 같은 카테고리에 추천할 강의가 없으면 다른 카테고리 추천
        if (!courses || courses.length === 0 || error) {
            console.log('[추천 강의] 2단계 시작 (다른 카테고리)');
            
            let query2 = window.supabase
                .from('courses')
                .select('id, title, thumbnail_url, price, category, lessons (id)')
                .eq('is_published', true);
            
            if (purchasedCourseIds.length > 0) {
                query2 = query2.not('id', 'in', `(${purchasedCourseIds.join(',')})`);
            }
            
            const { data: otherCourses, error: otherError } = await query2
                .order('created_at', { ascending: false })
                .limit(2);

            console.log('[추천 강의] 2단계 쿼리 결과:', { otherCourses, otherError });

            if (otherError) {
                console.error('[추천 강의] 2단계 에러:', otherError);
                throw otherError;
            }
            courses = otherCourses;
        }

        console.log('[추천 강의] 최종 추천 강의:', courses);

        if (!courses || courses.length === 0) {
            console.warn('[추천 강의] 추천할 강의가 없습니다.');
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
                    <div class="flex items-center justify-between pt-2">
                        <span class="text-white font-bold text-lg">${course.price ? `₩${course.price.toLocaleString()}` : '무료'}</span>
                        <span class="text-sm text-gray-400">${course.lessons?.length || 0}개 레슨</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('[추천 강의] 에러 발생:', error);
        console.error('[추천 강의] 에러 상세:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        container.innerHTML = '<p class="text-red-400 text-center col-span-full">추천 강의를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 마이페이지 쿠폰 탭으로 이동
function goToMyPageCoupons() {
    window.location.href = 'mypage.html?tab=coupons';
}

// 선생님 코멘트 자동 생성
function generateTeacherComment(watchRate, assignmentRate, progressRate) {
    let comments = [];
    
    // 완강 여부
    if (progressRate >= 100) {
        comments.push("🎉 강의를 완강했어요! 정말 대단합니다!");
    } else if (progressRate >= 80) {
        comments.push("거의 다 왔어요! 조금만 더 힘내세요!");
    }
    
    // 시청률 기반 코멘트
    if (watchRate >= 90) {
        comments.push("강의를 집중해서 시청했네요. 훌륭합니다! 💯");
    } else if (watchRate >= 70) {
        comments.push("강의를 꾸준히 잘 시청하고 있어요! 👍");
    } else if (watchRate >= 50) {
        comments.push("강의 시청률이 조금 낮아요. 복습하면서 다시 한번 들어보세요. 📚");
    } else {
        comments.push("강의를 좀 더 집중해서 들어보세요. 복습이 필요합니다. 💪");
    }
    
    // 과제 제출률 기반 코멘트
    if (assignmentRate >= 90) {
        comments.push("과제를 매우 성실하게 완수했어요. 최고예요! ✨");
    } else if (assignmentRate >= 70) {
        comments.push("과제를 잘 수행하고 있어요. 계속 이 자세를 유지하세요! ✅");
    } else if (assignmentRate >= 50) {
        comments.push("과제를 조금 더 신경 써서 제출해주세요. 📝");
    } else {
        comments.push("과제 제출이 부족해요. 과제는 학습에 매우 중요합니다! 🔥");
    }
    
    // 종합 평가
    const avgScore = (watchRate + assignmentRate) / 2;
    if (avgScore >= 85) {
        comments.push("전반적으로 매우 우수합니다. 이 페이스를 유지하면 실력이 쑥쑥 늘 거예요!");
    } else if (avgScore >= 70) {
        comments.push("꾸준히 잘하고 있어요. 앞으로도 화이팅!");
    } else {
        comments.push("조금 더 시간을 투자하면 더 좋은 결과를 얻을 수 있어요. 함께 노력해봐요!");
    }
    
    return comments.join(' ');
}












