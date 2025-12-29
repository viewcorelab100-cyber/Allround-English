// =============================================
// 채점 결과 ?��?지 ?�성 ?�수 (?��? 지??
// =============================================

/**
 * 채점 결과 ?��?지??HTML ?�성 (master.html ?�자???�름)
 * @param {Object} data - 채점 ?�이?? * @returns {string} HTML 문자?? */
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
            <!-- ?�더 -->
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
                <!-- ?�생 ?�보 -->
                <div style="margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">
                        Student
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 600; color: white;">
                        ${data.studentName || '?�생'}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.6);">
                        ${data.studentEmail || ''}
                    </p>
                </div>

                <!-- 과제 ?�보 -->
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
                        ${data.isPassed ? '채점완료' : '재제출요청'}
                    </p>
                </div>

                <!-- ?�생??코멘??-->
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

                <!-- ?��?지 ?�역: ?�생 ?�출(�? + ?�생??채점(?? -->
                ${(() => {
                    const hasStudentImage = data.imageUrl;
                    const hasGradingImage = data.gradingImageUrl || (data.gradingImageUrls && data.gradingImageUrls.length > 0);
                    const gradingImgSrc = data.gradingImageUrls && data.gradingImageUrls.length > 0 
                        ? data.gradingImageUrls[0] 
                        : data.gradingImageUrl;
                    
                    if (!hasStudentImage && !hasGradingImage) return '';
                    
                    // ?????�으�?좌우 배치
                    if (hasStudentImage && hasGradingImage) {
                        return `
                            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                                <div style="flex: 1;">
                                    <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                        Student's Work
                                    </p>
                                    <img src="${data.imageUrl}" alt="?�생 과제" style="
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
                                    <img src="${gradingImgSrc}" alt="?�생??채점" style="
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
                    
                    // ?�생 ?��?지�??�는 경우
                    if (hasStudentImage) {
                        return `
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                    Student's Work
                                </p>
                                <img src="${data.imageUrl}" alt="?�생 과제" style="
                                    width: 100%;
                                    max-height: 400px;
                                    object-fit: contain;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                ">
                            </div>
                        `;
                    }
                    
                    // ?�생??채점 ?��?지�??�는 경우
                    if (hasGradingImage) {
                        return `
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                    Teacher's Feedback
                                </p>
                                <img src="${gradingImgSrc}" alt="?�생??채점" style="
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

            <!-- ?�터 -->
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
 * ?��?지 URL??Base64�?변?? * @param {string} url - ?��?지 URL
 * @returns {Promise<string>} Base64 ?�이??URL
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
 * 채점 결과 ?��?지 ?�성 (?��? ?�벽 지??
 * @param {Object} data - 채점 ?�이?? * @returns {Promise<Blob>} ?��?지 Blob
 */
async function generateGradingPDF(data) {
    // ?��?지 URL??Base64�?변??(html2canvas CORS 문제 ?�결)
    let processedData = { ...data };
    
    // ?�생 ?�출 ?��?지 변??    if (data.imageUrl) {
        const base64Image = await imageUrlToBase64(data.imageUrl);
        if (base64Image) {
            processedData.imageUrl = base64Image;
        }
    }
    
    // ?�생??채점 ?��?지 변??    if (data.gradingImageUrl) {
        const base64GradingImage = await imageUrlToBase64(data.gradingImageUrl);
        if (base64GradingImage) {
            processedData.gradingImageUrl = base64GradingImage;
        }
    }
    
    // ?�러 채점 ?��?지 변??    if (data.gradingImageUrls && data.gradingImageUrls.length > 0) {
        const base64GradingImages = await Promise.all(
            data.gradingImageUrls.map(url => imageUrlToBase64(url))
        );
        processedData.gradingImageUrls = base64GradingImages.filter(img => img !== null);
    }
    
    // HTML ?�플�??�성
    const html = createGradingResultHTML(processedData);
    
    // ?�시 컨테?�너 ?�성
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    try {
        // ?��?지 로딩 ?�료 ?��?        const images = container.querySelectorAll('img');
        await Promise.all(
            Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // ?�러 ?�에??계속 진행
                });
            })
        );
        
        // html2canvas�??��?지 변??        const canvas = await html2canvas(container.querySelector('#grading-result-template'), {
            scale: 2,  // 고해?�도
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });

        // Canvas�?Blob?�로 변??        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('?��?지 ?�성 ?�패'));
                }
            }, 'image/png', 1.0);
        });
    } finally {
        // ?�시 컨테?�너 ?�거
        document.body.removeChild(container);
    }
}

/**
 * ?��?지 ?�로??�?공개 URL ?�성
 * @param {Blob} imageBlob - ?��?지 Blob
 * @param {string} fileName - ?�일�? * @returns {Promise<string>} 공개 URL
 */
async function uploadGradingPDF(imageBlob, fileName) {
    try {
        const filePath = `grading-reports/${fileName}`;
        
        
        const { data, error } = await window.supabase.storage
            .from('submissions')
            .upload(filePath, imageBlob, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: true
            });


        if (error) throw error;

        // 공개 URL ?�성
        const { data: { publicUrl } } = window.supabase.storage
            .from('submissions')
            .getPublicUrl(filePath);


        return publicUrl;
    } catch (error) {
        
        console.error('Image upload error:', error);
        throw error;
    }
}

/**
 * 채점 ?�료 ??PDF ?�성 �??�로?? * @param {Object} gradingData - 채점 ?�이?? * @returns {Promise<string>} PDF URL
 */
async function createAndUploadGradingPDF(gradingData) {
    try {

        // ?��?지 ?�성
        const imageBlob = await generateGradingPDF(gradingData);
        
        
        // ?�일�??�성 (?��?/?�수문자 ?�거)
        const timestamp = Date.now();
        const safeName = (gradingData.studentName || 'student').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `grading_${safeName}_${timestamp}.png`;
        
        
        // ?�로??        const imageUrl = await uploadGradingPDF(imageBlob, fileName);
        
        
        return imageUrl;
    } catch (error) {
        
        console.error('Create and upload image error:', error);
        throw error;
    }
}

// ?�역?�서 ?�용 가?�하?�록 export
window.PDFGenerator = {
    generateGradingPDF,
    uploadGradingPDF,
    createAndUploadGradingPDF
};

