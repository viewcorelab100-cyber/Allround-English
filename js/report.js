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












