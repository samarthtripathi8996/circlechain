import time


def test_home_load_time_under_2s(driver, base_url):
    # Cold load: new tab with cache clear via navigating with unique query
    start = time.time()
    driver.get(f"{base_url}/?t={int(start)}")
    nav = driver.execute_script("return performance.getEntriesByType('navigation')[0]")
    # Fallback if nav is None
    duration_ms = (nav.get("duration", None) if nav else None)
    if duration_ms is None:
        # Approximation using JS timing
        timing = driver.execute_script("return performance.timing")
        duration_ms = timing["loadEventEnd"] - timing["navigationStart"]
    assert duration_ms <= 2000, f"Load time too high: {duration_ms} ms"


def _element_fully_in_viewport(driver, selector: str) -> bool:
    script = """
    const el = document.querySelector(arguments[0]);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.left >= 0 &&
           r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
           r.right <= (window.innerWidth || document.documentElement.clientWidth);
    """
    return bool(driver.execute_script(script, selector))


def _no_horizontal_scroll(driver) -> bool:
    return driver.execute_script(
        "return document.documentElement.scrollWidth <= document.documentElement.clientWidth;"
    )


def test_responsive_layouts(driver, base_url):
    viewports = [(320, 640), (768, 1024), (1280, 800)]
    critical_selectors = ["[data-testid='navbar']", "[data-testid='primary-cta']"]
    for w, h in viewports:
        driver.set_window_size(w, h)
        driver.get(base_url)
        assert _no_horizontal_scroll(driver), f"Horizontal scroll at {w}x{h}"
        for sel in critical_selectors:
            assert _element_fully_in_viewport(driver, sel), f"{sel} not visible at {w}x{h}"
