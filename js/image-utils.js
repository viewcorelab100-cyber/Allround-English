// 이미지 유틸리티 함수들

/**
 * 이미지 파일을 WebP 형식으로 변환
 * @param {File} file - 원본 이미지 파일
 * @param {Object} options - 변환 옵션
 * @param {number} options.quality - 품질 (0-1, 기본값 0.85)
 * @param {number} options.maxWidth - 최대 너비 (기본값 1920)
 * @param {number} options.maxHeight - 최대 높이 (기본값 1080)
 * @returns {Promise<{file: File, originalSize: number, convertedSize: number}>}
 */
async function convertToWebP(file, options = {}) {
    const { quality = 0.85, maxWidth = 1920, maxHeight = 1080 } = options;

    // 이미지가 아닌 경우 원본 반환
    if (!file.type.startsWith('image/')) {
        return { file, originalSize: file.size, convertedSize: file.size };
    }

    // 이미 webp인 경우 리사이즈만 적용
    const isAlreadyWebP = file.type === 'image/webp';

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // 리사이즈 계산
            let { width, height } = img;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);

            // WebP로 변환
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('WebP 변환 실패'));
                        return;
                    }

                    // 파일명에서 확장자 제거 후 .webp 추가
                    const originalName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = `${originalName}.webp`;

                    const convertedFile = new File([blob], newFileName, {
                        type: 'image/webp',
                        lastModified: Date.now()
                    });

                    console.log(`[이미지 변환] ${file.name} -> ${newFileName}`);
                    console.log(`  원본: ${formatFileSize(file.size)}, 변환 후: ${formatFileSize(blob.size)} (${Math.round((1 - blob.size / file.size) * 100)}% 감소)`);

                    resolve({
                        file: convertedFile,
                        originalSize: file.size,
                        convertedSize: blob.size
                    });
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('이미지 로드 실패'));
        };

        // 파일을 Data URL로 읽기
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.onerror = () => {
            reject(new Error('파일 읽기 실패'));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * 여러 이미지 파일을 WebP로 변환
 * @param {FileList|Array<File>} files - 파일 목록
 * @param {Object} options - 변환 옵션
 * @returns {Promise<Array<{file: File, originalSize: number, convertedSize: number}>>}
 */
async function convertMultipleToWebP(files, options = {}) {
    const fileArray = Array.from(files);
    const results = await Promise.all(
        fileArray.map(file => convertToWebP(file, options))
    );
    return results;
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string}
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
