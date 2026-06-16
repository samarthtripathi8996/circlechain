def calculate_product_impact(category: str, weight: float = 1.0) -> float:
    """Calculate environmental impact placeholder based on category and weight"""
    # CO₂ equivalent factors (kg CO₂ per kg of product)
    impact_factors = {
        "electronics": 15.0,
        "textiles": 8.0,
        "packaging": 2.5,
        "furniture": 12.0,
        "other": 5.0
    }
    
    factor = impact_factors.get(category.lower(), 5.0)
    return factor * weight