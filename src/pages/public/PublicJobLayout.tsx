import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function PublicJobLayout() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/jobs')}>
                        <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Straatix</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/login')}>
                            Sign In
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <Outlet />
            </main>

            <footer className="bg-white border-t mt-auto">
                <div className="container mx-auto px-4 py-8 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Straatix. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
