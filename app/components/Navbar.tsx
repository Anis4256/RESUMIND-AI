import {Link} from "react-router";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <div className="flex gap-2 flex-wrap">
                <Link to="/job-applier" className="primary-button w-fit text-sm">
                    🤖 Search
                </Link>
                <Link to="/saved-jobs" className="primary-button w-fit text-sm">
                    ⭐ Saved
                </Link>
                <Link to="/applications" className="primary-button w-fit text-sm">
                    📊 Track
                </Link>
                <Link to="/skills-gap" className="primary-button w-fit text-sm">
                    📈 Skills
                </Link>
                <Link to="/search-history" className="primary-button w-fit text-sm">
                    🕒 History
                </Link>
                <Link to="/upload" className="primary-button w-fit text-sm">
                    📤 Upload
                </Link>
            </div>
        </nav>
    )
}
export default Navbar
