import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

@pytest.fixture(scope="session")
def base_url() -> str:
    # Set via env or edit default
    return os.getenv("BASE_URL", "https://example.com")

@pytest.fixture(scope="session")
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1366,900")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    drv = webdriver.Chrome(options=options)  # Selenium Manager resolves driver
    drv.set_page_load_timeout(30)
    drv.implicitly_wait(2)
    yield drv
    drv.quit()
