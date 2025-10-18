import axios from 'axios';

export async function fetchAiPriceSuggestion({ variety, quantity }) {
    // Mock API: returns a random fair price around a baseline derived from variety and quantity
    const varietyMultipliers = {
        'Samba': 120,
        'Nadu': 100,
        'Keeri Samba': 110,
        'Red Nadu': 105,
        'White Raw': 90,
        'Red Raw': 95,
        'Suwandel': 130,
        'Kalu Heenati': 140,
        'Masuran': 125,
        'Ma Wee': 115,
        'Kurulu Thuda': 135,
        'Rath Suwandal': 145
    };
    
    const basePrice = varietyMultipliers[variety] || 100;
    const quantityFactor = (quantity || 1) * 0.1;
    const noise = Math.round((Math.random() - 0.5) * basePrice * 0.2);
    const suggested = Math.max(50, basePrice + quantityFactor + noise);
    
    // Mock recommendation based on variety
    const recommendations = {
        'Samba': 'Good for daily consumption',
        'Nadu': 'Popular choice, stable price',
        'Keeri Samba': 'Premium quality',
        'Red Nadu': 'High nutritional value',
        'White Raw': 'Economical option',
        'Red Raw': 'Good value for money',
        'Suwandel': 'Premium aromatic rice',
        'Kalu Heenati': 'Traditional variety, high demand',
        'Masuran': 'Good for special occasions',
        'Ma Wee': 'Balanced quality and price',
        'Kurulu Thuda': 'Rare variety, premium price',
        'Rath Suwandal': 'Highest quality, luxury rice'
    };
    
    return { 
        price: suggested, 
        currency: 'LKR',
        recommendation: recommendations[variety] || 'Good quality rice',
        currentPrice: Math.round(suggested * 0.9) // Mock current market price
    };
}

export const api = axios.create({ baseURL: '/' });


