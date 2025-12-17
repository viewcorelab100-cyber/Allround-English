// =============================================
// 채점 결과 이미지 생성 함수 (한글 지원)
// =============================================

/**
 * 채점 결과 이미지용 HTML 생성 (master.html 디자인 따름)
 * @param {Object} data - 채점 데이터
 * @returns {string} HTML 문자열
 */
function createGradingResultHTML(data) {
    const gradedDate = new Date().toLocaleDateString('ko-KR');
    const submittedDate = data.submittedAt 
        ? new Date(data.submittedAt).toLocaleString('ko-KR') 
        : '-';
    
    return `
        <div id="grading-result-template" style="
            width: 800px;
            background: #000000;
            color: white;
            font-family: 'Playfair Display', serif;
            padding: 0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        ">
            <!-- 헤더 -->
            <div style="
                background: #000000;
                padding: 40px;
                text-align: center;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            ">
                <h1 style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 3px; color: white;">
                    ALLROUND ENGLISH
                </h1>
                <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.7); font-weight: 400;">
                    Assignment Grading Report
                </p>
            </div>

            <!-- 본문 -->
            <div style="padding: 40px; background: #000000;">
                <!-- 학생 정보 -->
                <div style="margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">
                        Student
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 600; color: white;">
                        ${data.studentName || '학생'}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.6);">
                        ${data.studentEmail || ''}
                    </p>
                </div>

                <!-- 과제 정보 -->
                <div style="margin-bottom: 35px; padding: 25px; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">
                        Assignment
                    </p>
                    <p style="margin: 0; font-size: 20px; font-weight: 600; color: white;">
                        ${data.assignmentTitle || '과제'}
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.5);">
                        Submitted: ${submittedDate}
                    </p>
                </div>

                <!-- 채점 결과 박스 -->
                <div style="
                    background: white;
                    padding: 35px;
                    border-radius: 12px;
                    margin-bottom: 35px;
                    text-align: center;
                    color: #000000;
                ">
                    <p style="margin: 0 0 20px 0; font-size: 13px; color: rgba(0,0,0,0.5); text-transform: uppercase; letter-spacing: 1px;">
                        Grading Result
                    </p>
                    <div style="display: flex; justify-content: center; gap: 50px; align-items: center; margin-bottom: 25px;">
                        ${data.score !== null && data.score !== undefined ? `
                            <div>
                                <p style="margin: 0; font-size: 56px; font-weight: 700; color: #000000;">${data.score}</p>
                                <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(0,0,0,0.5);">/ 100</p>
                            </div>
                        ` : ''}
                        ${data.grade ? `
                            <div>
                                <p style="margin: 0; font-size: 48px; font-weight: 700; color: #000000;">${data.grade}</p>
                                <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(0,0,0,0.5);">Grade</p>
                            </div>
                        ` : ''}
                    </div>
                    <p style="
                        margin: 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: ${data.isPassed ? '#000000' : '#dc2626'};
                        letter-spacing: 2px;
                    ">
                        ${data.isPassed ? 'PASSED' : 'RESUBMISSION REQUIRED'}
                    </p>
                </div>

                <!-- 선생님 코멘트 -->
                ${data.comment ? `
                    <div style="margin-bottom: 35px; padding: 30px; background: rgba(255,255,255,0.03); border-radius: 12px;">
                        <p style="margin: 0 0 15px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                            Teacher's Comment
                        </p>
                        <p style="margin: 0; font-size: 16px; line-height: 1.8; color: rgba(255,255,255,0.9); text-align: center;">
                            ${data.comment}
                        </p>
                    </div>
                ` : ''}

                <!-- 이미지 영역: 학생 제출(좌) + 선생님 채점(우) -->
                ${(() => {
                    const hasStudentImage = data.imageUrl;
                    const hasGradingImage = data.gradingImageUrl || (data.gradingImageUrls && data.gradingImageUrls.length > 0);
                    const gradingImgSrc = data.gradingImageUrls && data.gradingImageUrls.length > 0 
                        ? data.gradingImageUrls[0] 
                        : data.gradingImageUrl;
                    
                    if (!hasStudentImage && !hasGradingImage) return '';
                    
                    // 둘 다 있으면 좌우 배치
                    if (hasStudentImage && hasGradingImage) {
                        return `
                            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                                <div style="flex: 1;">
                                    <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                        Student's Work
                                    </p>
                                    <img src="${data.imageUrl}" alt="학생 과제" style="
                                        width: 100%;
                                        height: 350px;
                                        object-fit: cover;
                                        border-radius: 8px;
                                        border: 1px solid rgba(255,255,255,0.1);
                                    ">
                                </div>
                                <div style="flex: 1;">
                                    <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                        Teacher's Feedback
                                    </p>
                                    <img src="${gradingImgSrc}" alt="선생님 채점" style="
                                        width: 100%;
                                        height: 350px;
                                        object-fit: cover;
                                        border-radius: 8px;
                                        border: 1px solid rgba(255,255,255,0.1);
                                    ">
                                </div>
                            </div>
                        `;
                    }
                    
                    // 학생 이미지만 있는 경우
                    if (hasStudentImage) {
                        return `
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                    Student's Work
                                </p>
                                <img src="${data.imageUrl}" alt="학생 과제" style="
                                    width: 100%;
                                    max-height: 400px;
                                    object-fit: contain;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                ">
                            </div>
                        `;
                    }
                    
                    // 선생님 채점 이미지만 있는 경우
                    if (hasGradingImage) {
                        return `
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                    Teacher's Feedback
                                </p>
                                <img src="${gradingImgSrc}" alt="선생님 채점" style="
                                    width: 100%;
                                    max-height: 400px;
                                    object-fit: contain;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                ">
                            </div>
                        `;
                    }
                    
                    return '';
                })()}
            </div>

            <!-- 푸터 -->
            <div style="
                padding: 30px;
                background: #000000;
                text-align: center;
                font-size: 12px;
                color: rgba(255,255,255,0.4);
                border-top: 1px solid rgba(255,255,255,0.1);
            ">
                <p style="margin: 0; letter-spacing: 1px;">ALLROUND ENGLISH ACADEMY</p>
                <p style="margin: 8px 0 0 0;">${gradedDate}</p>
            </div>
        </div>
    `;
}

/**
 * 이미지 URL을 Base64로 변환
 * @param {string} url - 이미지 URL
 * @returns {Promise<string>} Base64 데이터 URL
 */
async function imageUrlToBase64(url) {
    if (!url) return null;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Image to Base64 error:', url, error);
        return null;
    }
}

/**
 * 채점 결과 이미지 생성 (한글 완벽 지원)
 * @param {Object} data - 채점 데이터
 * @returns {Promise<Blob>} 이미지 Blob
 */
async function generateGradingPDF(data) {
    // 이미지 URL을 Base64로 변환 (html2canvas CORS 문제 해결)
    let processedData = { ...data };
    
    // 학생 제출 이미지 변환
    if (data.imageUrl) {
        const base64Image = await imageUrlToBase64(data.imageUrl);
        if (base64Image) {
            processedData.imageUrl = base64Image;
        }
    }
    
    // 선생님 채점 이미지 변환
    if (data.gradingImageUrl) {
        const base64GradingImage = await imageUrlToBase64(data.gradingImageUrl);
        if (base64GradingImage) {
            processedData.gradingImageUrl = base64GradingImage;
        }
    }
    
    // 여러 채점 이미지 변환
    if (data.gradingImageUrls && data.gradingImageUrls.length > 0) {
        const base64GradingImages = await Promise.all(
            data.gradingImageUrls.map(url => imageUrlToBase64(url))
        );
        processedData.gradingImageUrls = base64GradingImages.filter(img => img !== null);
    }
    
    // HTML 템플릿 생성
    const html = createGradingResultHTML(processedData);
    
    // 임시 컨테이너 생성
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    try {
        // 이미지 로딩 완료 대기
        const images = container.querySelectorAll('img');
        await Promise.all(
            Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // 에러 시에도 계속 진행
                });
            })
        );
        
        // html2canvas로 이미지 변환
        const canvas = await html2canvas(container.querySelector('#grading-result-template'), {
            scale: 2,  // 고해상도
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });

        // Canvas를 Blob으로 변환
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('이미지 생성 실패'));
                }
            }, 'image/png', 1.0);
        });
    } finally {
        // 임시 컨테이너 제거
        document.body.removeChild(container);
    }
}

/**
 * 이미지 업로드 및 공개 URL 생성
 * @param {Blob} imageBlob - 이미지 Blob
 * @param {string} fileName - 파일명
 * @returns {Promise<string>} 공개 URL
 */
async function uploadGradingPDF(imageBlob, fileName) {
    try {
        const filePath = `grading-reports/${fileName}`;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:330',message:'BEFORE storage upload',data:{filePath,blobSize:imageBlob.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        const { data, error } = await window.supabase.storage
            .from('submissions')
            .upload(filePath, imageBlob, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: true
            });

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:343',message:'AFTER storage upload',data:{hasError:!!error,error:error?{message:error.message,statusCode:error.statusCode}:null,data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion

        if (error) throw error;

        // 공개 URL 생성
        const { data: { publicUrl } } = window.supabase.storage
            .from('submissions')
            .getPublicUrl(filePath);

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:354',message:'publicUrl generated',data:{publicUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion

        return publicUrl;
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:360',message:'uploadGradingPDF ERROR',data:{error:{message:error.message,stack:error.stack}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        console.error('Image upload error:', error);
        throw error;
    }
}

/**
 * 채점 완료 후 PDF 생성 및 업로드
 * @param {Object} gradingData - 채점 데이터
 * @returns {Promise<string>} PDF URL
 */
async function createAndUploadGradingPDF(gradingData) {
    try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:357',message:'createAndUploadGradingPDF START',data:{gradingData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion

        // 이미지 생성
        const imageBlob = await generateGradingPDF(gradingData);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:363',message:'generateGradingPDF complete',data:{blobSize:imageBlob?.size,blobType:imageBlob?.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        
        // 파일명 생성 (한글/특수문자 제거)
        const timestamp = Date.now();
        const safeName = (gradingData.studentName || 'student').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `grading_${safeName}_${timestamp}.png`;
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:372',message:'BEFORE uploadGradingPDF',data:{fileName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        // 업로드
        const imageUrl = await uploadGradingPDF(imageBlob, fileName);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:380',message:'uploadGradingPDF complete',data:{imageUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        return imageUrl;
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pdf-generator.js:386',message:'createAndUploadGradingPDF ERROR',data:{error:{message:error.message,stack:error.stack}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
        // #endregion
        
        console.error('Create and upload image error:', error);
        throw error;
    }
}

// 전역에서 사용 가능하도록 export
window.PDFGenerator = {
    generateGradingPDF,
    uploadGradingPDF,
    createAndUploadGradingPDF
};

