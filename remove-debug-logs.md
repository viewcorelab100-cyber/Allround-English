# 디버그 로그 제거 가이드

## 자동 제거 (권장)

VS Code에서 정규표현식 검색-치환 사용:

### 1단계: 검색-치환 열기
- Windows: `Ctrl + H`
- Mac: `Cmd + Option + F`

### 2단계: 정규표현식 활성화
- 검색창 오른쪽의 `.*` 아이콘 클릭 (Use Regular Expression)

### 3단계: 검색 및 치환

**검색 패턴:**
```regex
\s*// #region agent log[\s\S]*?// #endregion\n
```

**치환 내용:** (빈칸으로 둠)

**적용 파일:**
- `payment-success.html`
- `mypage.html`
- `js/courses.js`

### 4단계: 전체 치환
- "Replace All" 버튼 클릭

---

## 수동 제거

각 파일에서 다음 블록을 모두 삭제:

```javascript
// #region agent log
... (console.log 또는 fetch 코드)
// #endregion
```

---

## 제거할 파일 목록

1. ✅ **payment-success.html** - 8개 블록
2. ✅ **mypage.html** - 7개 블록
3. ✅ **js/courses.js** - 3개 블록

총 18개의 디버그 로그 블록

---

## 제거 후 확인

1. 브라우저 콘솔에서 `[DEBUG]` 메시지가 안 나오는지 확인
2. 결제 및 마이페이지 정상 작동 확인
3. Git commit 전 변경사항 리뷰

---

## 보존할 코드

다음은 **제거하지 마세요**:
- `console.error()` - 실제 에러 로깅
- `alert()` - 사용자 알림
- 일반 주석

**제거 대상은 `// #region agent log`로 감싸진 블록만입니다.**























