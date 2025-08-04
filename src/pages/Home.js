import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function Home() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div style={{ maxWidth: '420px', margin: '96px auto' }}>
            <h2>Welcome to Skillogue!</h2>
            <p>You are now logged in.</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}

export default Home