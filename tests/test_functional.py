from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_login_success(driver, base_url):
    driver.get(f"{base_url}/login")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='email']").send_keys("user@example.com")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='password']").send_keys("correcthorsebatterystaple")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='login-submit']").click()
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='dashboard']"))
    )
    assert driver.current_url.startswith(f"{base_url}/dashboard")


def test_contact_form_submission(driver, base_url):
    driver.get(f"{base_url}/contact")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='contact-name']").send_keys("Test User")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='contact-email']").send_keys("user@example.com")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='contact-message']").send_keys("Hello from Selenium!")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='contact-submit']").click()
    toast = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='toast-success']"))
    )
    assert "Thank you" in toast.text
