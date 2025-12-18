// =============================================
// Ï±ÑÏ†ê Í≤∞Í≥º ?¥Î?ÏßÄ ?ùÏÑ± ?®Ïàò (?úÍ? ÏßÄ??
// =============================================

/**
 * Ï±ÑÏ†ê Í≤∞Í≥º ?¥Î?ÏßÄ??HTML ?ùÏÑ± (master.html ?îÏûê???∞Î¶Ñ)
 * @param {Object} data - Ï±ÑÏ†ê ?∞Ïù¥?? * @returns {string} HTML Î¨∏Ïûê?? */
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
            <!-- ?§Îçî -->
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

            <!-- Î≥∏Î¨∏ -->
            <div style="padding: 40px; background: #000000;">
                <!-- ?ôÏÉù ?ïÎ≥¥ -->
                <div style="margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">
                        Student
                    </p>
                    <p style="margin: 0; font-size: 24px; font-weight: 600; color: white;">
                        ${data.studentName || '?ôÏÉù'}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.6);">
                        ${data.studentEmail || ''}
                    </p>
                </div>

                <!-- Í≥ºÏ†ú ?ïÎ≥¥ -->
                <div style="margin-bottom: 35px; padding: 25px; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">
                        Assignment
                    </p>
                    <p style="margin: 0; font-size: 20px; font-weight: 600; color: white;">
                        ${data.assignmentTitle || 'Í≥ºÏ†ú'}
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.5);">
                        Submitted: ${submittedDate}
                    </p>
                </div>

                <!-- Ï±ÑÏ†ê Í≤∞Í≥º Î∞ïÏä§ -->
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

                <!-- ?†ÏÉù??ÏΩîÎ©ò??-->
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

                <!-- ?¥Î?ÏßÄ ?ÅÏó≠: ?ôÏÉù ?úÏ∂ú(Ï¢? + ?†ÏÉù??Ï±ÑÏ†ê(?? -->
                ${(() => {
                    const hasStudentImage = data.imageUrl;
                    const hasGradingImage = data.gradingImageUrl || (data.gradingImageUrls && data.gradingImageUrls.length > 0);
                    const gradingImgSrc = data.gradingImageUrls && data.gradingImageUrls.length > 0 
                        ? data.gradingImageUrls[0] 
                        : data.gradingImageUrl;
                    
                    if (!hasStudentImage && !hasGradingImage) return '';
                    
                    // ?????àÏúºÎ©?Ï¢åÏö∞ Î∞∞Ïπò
                    if (hasStudentImage && hasGradingImage) {
                        return `
                            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                                <div style="flex: 1;">
                                    <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                        Student's Work
                                    </p>
                                    <img src="${data.imageUrl}" alt="?ôÏÉù Í≥ºÏ†ú" style="
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
                                    <img src="${gradingImgSrc}" alt="?†ÏÉù??Ï±ÑÏ†ê" style="
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
                    
                    // ?ôÏÉù ?¥Î?ÏßÄÎß??àÎäî Í≤ΩÏö∞
                    if (hasStudentImage) {
                        return `
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                    Student's Work
                                </p>
                                <img src="${data.imageUrl}" alt="?ôÏÉù Í≥ºÏ†ú" style="
                                    width: 100%;
                                    max-height: 400px;
                                    object-fit: contain;
                                    border-radius: 8px;
                                    border: 1px solid rgba(255,255,255,0.1);
                                ">
                            </div>
                        `;
                    }
                    
                    // ?†ÏÉù??Ï±ÑÏ†ê ?¥Î?ÏßÄÎß??àÎäî Í≤ΩÏö∞
                    if (hasGradingImage) {
                        return `
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 12px 0; font-size: 13px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                    Teacher's Feedback
                                </p>
                                <img src="${gradingImgSrc}" alt="?†ÏÉù??Ï±ÑÏ†ê" style="
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

            <!-- ?∏ÌÑ∞ -->
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
 * ?¥Î?ÏßÄ URL??Base64Î°?Î≥Ä?? * @param {string} url - ?¥Î?ÏßÄ URL
 * @returns {Promise<string>} Base64 ?∞Ïù¥??URL
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
 * Ï±ÑÏ†ê Í≤∞Í≥º ?¥Î?ÏßÄ ?ùÏÑ± (?úÍ? ?ÑÎ≤Ω ÏßÄ??
 * @param {Object} data - Ï±ÑÏ†ê ?∞Ïù¥?? * @returns {Promise<Blob>} ?¥Î?ÏßÄ Blob
 */
async function generateGradingPDF(data) {
    // ?¥Î?ÏßÄ URL??Base64Î°?Î≥Ä??(html2canvas CORS Î¨∏Ï†ú ?¥Í≤∞)
    let processedData = { ...data };
    
    // ?ôÏÉù ?úÏ∂ú ?¥Î?ÏßÄ Î≥Ä??    if (data.imageUrl) {
        const base64Image = await imageUrlToBase64(data.imageUrl);
        if (base64Image) {
            processedData.imageUrl = base64Image;
        }
    }
    
    // ?†ÏÉù??Ï±ÑÏ†ê ?¥Î?ÏßÄ Î≥Ä??    if (data.gradingImageUrl) {
        const base64GradingImage = await imageUrlToBase64(data.gradingImageUrl);
        if (base64GradingImage) {
            processedData.gradingImageUrl = base64GradingImage;
        }
    }
    
    // ?¨Îü¨ Ï±ÑÏ†ê ?¥Î?ÏßÄ Î≥Ä??    if (data.gradingImageUrls && data.gradingImageUrls.length > 0) {
        const base64GradingImages = await Promise.all(
            data.gradingImageUrls.map(url => imageUrlToBase64(url))
        );
        processedData.gradingImageUrls = base64GradingImages.filter(img => img !== null);
    }
    
    // HTML ?úÌîåÎ¶??ùÏÑ±
    const html = createGradingResultHTML(processedData);
    
    // ?ÑÏãú Ïª®ÌÖå?¥ÎÑà ?ùÏÑ±
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    try {
        // ?¥Î?ÏßÄ Î°úÎî© ?ÑÎ£å ?ÄÍ∏?        const images = container.querySelectorAll('img');
        await Promise.all(
            Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // ?êÎü¨ ?úÏóê??Í≥ÑÏÜç ÏßÑÌñâ
                });
            })
        );
        
        // html2canvasÎ°??¥Î?ÏßÄ Î≥Ä??        const canvas = await html2canvas(container.querySelector('#grading-result-template'), {
            scale: 2,  // Í≥†Ìï¥?ÅÎèÑ
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });

        // CanvasÎ•?Blob?ºÎ°ú Î≥Ä??        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('?¥Î?ÏßÄ ?ùÏÑ± ?§Ìå®'));
                }
            }, 'image/png', 1.0);
        });
    } finally {
        // ?ÑÏãú Ïª®ÌÖå?¥ÎÑà ?úÍ±∞
        document.body.removeChild(container);
    }
}

/**
 * ?¥Î?ÏßÄ ?ÖÎ°ú??Î∞?Í≥µÍ∞ú URL ?ùÏÑ±
 * @param {Blob} imageBlob - ?¥Î?ÏßÄ Blob
 * @param {string} fileName - ?åÏùºÎ™? * @returns {Promise<string>} Í≥µÍ∞ú URL
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

        // Í≥µÍ∞ú URL ?ùÏÑ±
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
 * Ï±ÑÏ†ê ?ÑÎ£å ??PDF ?ùÏÑ± Î∞??ÖÎ°ú?? * @param {Object} gradingData - Ï±ÑÏ†ê ?∞Ïù¥?? * @returns {Promise<string>} PDF URL
 */
async function createAndUploadGradingPDF(gradingData) {
    try {

        // ?¥Î?ÏßÄ ?ùÏÑ±
        const imageBlob = await generateGradingPDF(gradingData);
        
        
        // ?åÏùºÎ™??ùÏÑ± (?úÍ?/?πÏàòÎ¨∏Ïûê ?úÍ±∞)
        const timestamp = Date.now();
        const safeName = (gradingData.studentName || 'student').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `grading_${safeName}_${timestamp}.png`;
        
        
        // ?ÖÎ°ú??        const imageUrl = await uploadGradingPDF(imageBlob, fileName);
        
        
        return imageUrl;
    } catch (error) {
        
        console.error('Create and upload image error:', error);
        throw error;
    }
}

// ?ÑÏó≠?êÏÑú ?¨Ïö© Í∞Ä?•Ìïò?ÑÎ°ù export
window.PDFGenerator = {
    generateGradingPDF,
    uploadGradingPDF,
    createAndUploadGradingPDF
};

