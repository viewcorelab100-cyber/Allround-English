// Global Footer Component
// This script injects the global footer into the page

function loadGlobalFooter() {
    // Check if footer already exists to prevent duplicates
    if (document.getElementById('allround-footer')) return;

    // Create footer element
    const footer = document.createElement('footer');
    footer.id = 'allround-footer';
    // Added clear-both to ensure footer is below all floated/flexed content
    // Added left-0 right-0 to ensure full width even with sidebars
    footer.className = 'bg-black text-white pt-20 border-t border-white/10 w-full flex flex-col justify-between overflow-hidden relative clear-both';
    // Inline style to ensure full width positioning
    footer.style.cssText = 'position: relative; left: 0; right: 0; width: 100vw; margin-left: 0;';
    
    // Footer HTML Content
    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-6 w-full relative z-10">
            
            <!-- Top Section: Columns -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16 md:mb-24">
                
                <!-- Brand/Company Info (Left) -->
                <div class="md:col-span-4 space-y-6">
                    <div>
                        <h3 class="text-sm font-bold mb-6 font-['Playfair_Display'] tracking-widest text-gray-500 uppercase">INQUIRIES</h3>
                        <div class="space-y-4 text-sm text-gray-300 leading-relaxed">
                            <p class="font-semibold text-white text-lg font-['Playfair_Display']">올라운드(ALLROUND)</p>
                            <div class="text-xs text-gray-500 space-y-1 font-light">
                                <p>대표자: 배은영 | 개인정보보호책임자: 배은영</p>
                                <p>사업자등록번호: 721-18-02487</p>
                                <p>통신판매업신고: 2025-서울강남-0000호</p>
                                <p>주소: 서울 강남구 대치동 943-29 3층 3138호</p>
                                <p class="pt-2">Email: contact@allround.co.kr</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty Col -->
                <div class="hidden md:block md:col-span-2"></div>

                <!-- Links Column 1 -->
                <div class="md:col-span-2">
                    <h4 class="font-bold mb-6 text-sm tracking-wider text-gray-500 uppercase">EXPLORE</h4>
                    <ul class="space-y-3 text-sm font-light">
                        <li><a href="about.html" class="hover:text-white text-gray-400 transition-colors">About</a></li>
                        <li><a href="courses.html" class="hover:text-white text-gray-400 transition-colors">Courses</a></li>
                        <li><a href="original.html" class="hover:text-white text-gray-400 transition-colors">Original</a></li>
                        <li><a href="firstee.html" class="hover:text-white text-gray-400 transition-colors">Firstee</a></li>
                        <li><a href="artist.html" class="hover:text-white text-gray-400 transition-colors">Artist</a></li>
                    </ul>
                </div>

                <!-- Links Column 2 -->
                <div class="md:col-span-2">
                    <h4 class="font-bold mb-6 text-sm tracking-wider text-gray-500 uppercase">LEGAL</h4>
                    <ul class="space-y-3 text-sm font-light">
                        <li><a href="#" class="hover:text-white text-gray-400 transition-colors">Terms of Service</a></li>
                        <li><a href="#" class="hover:text-white text-gray-400 transition-colors font-semibold">Privacy Policy</a></li>
                    </ul>
                </div>
                
                 <!-- Socials -->
                <div class="md:col-span-2">
                    <h4 class="font-bold mb-6 text-sm tracking-wider text-gray-500 uppercase">CONNECT</h4>
                    <div class="flex flex-col space-y-3 text-sm font-light">
                        <a href="#" class="hover:text-white text-gray-400 transition-colors">Instagram</a>
                        <a href="#" class="hover:text-white text-gray-400 transition-colors">Youtube</a>
                        <a href="#" class="hover:text-white text-gray-400 transition-colors">Blog</a>
                    </div>
                </div>
            </div>

            <!-- Bottom Copyright Line (Moved up before the big text to avoid overlay issues) -->
             <div class="flex flex-col md:flex-row justify-between items-end border-t border-white/10 pt-6 pb-8 md:pb-12">
                <div class="flex flex-col gap-1">
                    <p class="text-[10px] text-gray-600 uppercase tracking-widest">&copy; 2025 ALLROUND. ALL RIGHTS RESERVED.</p>
                </div>
                <p class="text-[10px] text-gray-600 uppercase tracking-widest mt-2 md:mt-0">ENGLISH COMMUNICATION TRAINING</p>
            </div>

        </div>

        <!-- Huge Brand Name (At the very bottom, flush) -->
        <div class="w-full overflow-hidden leading-none select-none pointer-events-none mt-auto">
            <h2 class="font-['Playfair_Display'] text-[18vw] font-bold tracking-tighter text-white text-center opacity-100 whitespace-nowrap translate-y-[2%]" style="line-height: 0.8;">
                ALLROUND
            </h2>
        </div>
    `;

    // Remove existing footers
    const existingFooters = document.querySelectorAll('footer');
    existingFooters.forEach(f => f.remove());

    // Always append to body to ensure full width (especially for admin pages with sidebars)
    document.body.appendChild(footer);
    
    // Special handling for admin page with sidebar
    // Check if there's a sidebar (admin page)
    const sidebar = document.querySelector('aside.fixed');
    if (sidebar) {
        // For admin pages, ensure footer spans full width by breaking out of flex container
        footer.style.position = 'relative';
        footer.style.marginLeft = '0';
        footer.style.width = '100vw';
        // Also need to ensure the parent flex container allows this
        const flexParent = document.querySelector('body > div.flex');
        if (flexParent) {
            // Make body use flex column to stack header, content, and footer
            document.body.style.display = 'flex';
            document.body.style.flexDirection = 'column';
        }
    }
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGlobalFooter);
} else {
    loadGlobalFooter();
}
