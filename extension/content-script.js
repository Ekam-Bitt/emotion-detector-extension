(() => {
    const selectors = [
        // YouTube comments
        "#contents ytd-comment-thread-renderer #content-text",
        // Reddit posts and comments
        "div[data-testid='post-container'] p, div[data-testid='comment'] p",
        // Twitter tweets
        "article div[lang]",
        // Fallback generic paragraphs
        "p",
    ];

    let elements = [];
    for (const selector of selectors) {
        elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) break;
    }

    // Return text, original index, and filter/slice
    return elements
        .map((el, index) => ({
            text: el.innerText,
            originalIndex: index,
        }))
        .filter((item) => item.text && item.text.length > 10)
        .map(item => ({
            ...item,
            text: item.text.slice(0, 500) // Truncate text
        }));
})();
