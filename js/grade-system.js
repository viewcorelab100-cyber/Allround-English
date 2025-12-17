/**
 * 점수 기반 자동 등급 시스템
 * 점수에 따라 등급과 메시지를 자동으로 생성합니다
 */

/**
 * 점수에 따른 등급 정보를 반환합니다
 * @param {number} score - 점수 (0-100)
 * @returns {Object} { grade: string, message: string, emoji: string, color: string }
 */
function getGradeInfo(score) {
    // 점수 유효성 검사
    if (score === null || score === undefined || isNaN(score)) {
        return {
            grade: '-',
            message: '점수 없음',
            emoji: '📝',
            color: '#gray-400',
            bgColor: 'bg-gray-500',
            textColor: 'text-gray-400'
        };
    }

    const numScore = Number(score);

    // 점수별 등급 정의
    if (numScore >= 95 && numScore <= 100) {
        return {
            grade: 'A+',
            message: '완벽히 이해했어요!',
            emoji: '🌟',
            color: '#FFD700',
            bgColor: 'bg-yellow-500',
            textColor: 'text-yellow-400',
            description: '모든 개념을 완벽하게 이해하고 있습니다. 훌륭합니다!'
        };
    } 
    else if (numScore >= 90 && numScore < 95) {
        return {
            grade: 'A',
            message: '작은 실수가 있었지만 정확히 이해하고 있어요!',
            emoji: '✨',
            color: '#FFE55C',
            bgColor: 'bg-yellow-400',
            textColor: 'text-yellow-300',
            description: '매우 우수한 이해도를 보여주고 있습니다.'
        };
    }
    else if (numScore >= 85 && numScore < 90) {
        return {
            grade: 'B+',
            message: '대부분 이해했어요! 조금만 더 복습하면 완벽해요!',
            emoji: '💫',
            color: '#90EE90',
            bgColor: 'bg-green-400',
            textColor: 'text-green-400',
            description: '우수한 수준입니다. 조금만 더 노력하면 완벽합니다!'
        };
    }
    else if (numScore >= 80 && numScore < 85) {
        return {
            grade: 'B',
            message: '잘 이해하고 있어요!',
            emoji: '✅',
            color: '#98D8C8',
            bgColor: 'bg-green-300',
            textColor: 'text-green-300',
            description: '좋은 이해도를 보여주고 있습니다.'
        };
    }
    else if (numScore >= 75 && numScore < 80) {
        return {
            grade: 'C+',
            message: '기본은 이해했어요! 조금 더 연습이 필요해요!',
        emoji: '📚',
            color: '#87CEEB',
            bgColor: 'bg-blue-400',
            textColor: 'text-blue-400',
            description: '기본 개념은 잘 이해하고 있습니다. 복습을 추천합니다.'
        };
    }
    else if (numScore >= 70 && numScore < 75) {
        return {
            grade: 'C',
            message: '기본 개념은 알고 있어요! 복습하면 더 좋아질 거예요!',
            emoji: '📖',
            color: '#87CEEB',
            bgColor: 'bg-blue-300',
            textColor: 'text-blue-300',
            description: '기본 수준입니다. 추가 학습이 필요합니다.'
        };
    }
    else if (numScore >= 60 && numScore < 70) {
        return {
            grade: 'D',
            message: '조금 더 노력이 필요해요! 다시 한번 복습해봐요!',
            emoji: '💪',
            color: '#FFA500',
            bgColor: 'bg-orange-400',
            textColor: 'text-orange-400',
            description: '추가 학습이 필요합니다. 선생님과 상담을 권장합니다.'
        };
    }
    else {
        return {
            grade: 'F',
            message: '다시 공부해봐요! 선생님께 질문하세요!',
            emoji: '📝',
            color: '#FF6B6B',
            bgColor: 'bg-red-500',
            textColor: 'text-red-400',
            description: '기본 개념 학습이 필요합니다. 반드시 복습하세요.'
        };
    }
}

/**
 * HTML 형식의 등급 배지를 생성합니다
 * @param {number} score - 점수
 * @param {boolean} showMessage - 메시지 포함 여부 (기본: true)
 * @returns {string} HTML 문자열
 */
function createGradeBadgeHTML(score, showMessage = true) {
    const gradeInfo = getGradeInfo(score);
    
    if (!showMessage) {
        return `
            <div class="inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${gradeInfo.bgColor} bg-opacity-20 border border-current ${gradeInfo.textColor}">
                <span class="text-2xl">${gradeInfo.emoji}</span>
                <span class="font-bold text-xl">${gradeInfo.grade}</span>
            </div>
        `;
    }

    return `
        <div class="inline-block px-6 py-4 rounded-xl ${gradeInfo.bgColor} bg-opacity-10 border-2 border-current ${gradeInfo.textColor}">
            <div class="flex items-center space-x-3 mb-2">
                <span class="text-3xl">${gradeInfo.emoji}</span>
                <span class="font-bold text-2xl">${gradeInfo.grade}</span>
            </div>
            <p class="text-lg font-semibold mt-2">${gradeInfo.message}</p>
        </div>
    `;
}

/**
 * 점수 카드 HTML을 생성합니다 (상세 버전)
 * @param {number} score - 점수
 * @param {number} maxScore - 만점 (기본: 100)
 * @returns {string} HTML 문자열
 */
function createScoreCardHTML(score, maxScore = 100) {
    const gradeInfo = getGradeInfo(score);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return `
        <div class="bg-white bg-opacity-5 rounded-2xl p-8 text-center space-y-6">
            <!-- 점수 표시 -->
            <div class="space-y-2">
                <p class="text-sm text-gray-400 uppercase tracking-wider">Your Score</p>
                <div class="text-6xl font-bold text-white">
                    ${score}<span class="text-3xl text-gray-400">/${maxScore}</span>
                </div>
                <p class="text-2xl ${gradeInfo.textColor} font-bold">${percentage}%</p>
            </div>

            <!-- 등급 배지 -->
            <div class="flex justify-center">
                ${createGradeBadgeHTML(percentage, true)}
            </div>

            <!-- 설명 -->
            ${gradeInfo.description ? `
                <p class="text-sm text-gray-400 leading-relaxed">
                    ${gradeInfo.description}
                </p>
            ` : ''}
        </div>
    `;
}

/**
 * 간단한 등급 텍스트만 반환 (PDF 등에서 사용)
 * @param {number} score - 점수
 * @returns {string} 등급 (A+, A, B+, etc.)
 */
function getGradeText(score) {
    return getGradeInfo(score).grade;
}

/**
 * 등급 메시지만 반환
 * @param {number} score - 점수
 * @returns {string} 등급 메시지
 */
function getGradeMessage(score) {
    return getGradeInfo(score).message;
}

