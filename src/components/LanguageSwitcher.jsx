import { useAuth } from '../hooks/useAuth.js';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useAuth();
    return (
        <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
        >
            <option value="en">EN</option>
            <option value="ta">TA</option>
            <option value="si">SI</option>
        </select>
    );
}


