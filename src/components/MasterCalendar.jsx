import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    CreditCard,
    Video,
    Activity,
    User,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { getStudents } from '../lib/supabase';

const MasterCalendar = ({ onSelectStudent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getStudents();
                setStudents(data);
            } catch (err) {
                console.error("Error loading students for calendar:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    // Mapear eventos
    const getEventsForDay = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const events = [];

        students.forEach(s => {
            // Pagos
            if (s.next_payment_date === dateStr) {
                events.push({ type: 'payment', student: s, icon: <CreditCard size={10} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' });
            }
            // Check-ins
            if (s.next_checkin_date === dateStr) {
                events.push({ type: 'checkin', student: s, icon: <Activity size={10} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' });
            }
            // Video llamadas
            if (s.next_videocall_date) {
                const callDate = new Date(s.next_videocall_date);
                if (callDate.getFullYear() === year && callDate.getMonth() === month && callDate.getDate() === day) {
                    events.push({
                        type: 'videocall',
                        student: s,
                        icon: <Video size={10} />,
                        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                        time: callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
            }
        });

        return events;
    };

    const renderDays = () => {
        const days = [];
        // Celdas vacías al inicio
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 border border-zinc-900/50 bg-zinc-950/20"></div>);
        }

        // Días del mes
        for (let d = 1; d <= totalDays; d++) {
            const events = getEventsForDay(d);
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

            days.push(
                <div key={d} className={`h-32 border border-zinc-900/50 p-2 transition-colors hover:bg-zinc-900/20 ${isToday ? 'bg-primary/5' : 'bg-surface'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-zinc-500'}`}>
                            {d}
                        </span>
                        {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.6)]" />}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                        {events.map((e, idx) => (
                            <div
                                key={idx}
                                onClick={() => onSelectStudent(e.student)}
                                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[9px] font-medium cursor-pointer hover:opacity-80 transition-opacity truncate ${e.color}`}
                                title={`${e.student.full_name} - ${e.type === 'payment' ? 'Pago' : e.type === 'checkin' ? 'Control' : 'Video'}`}
                            >
                                {e.icon}
                                <span className="truncate">{e.student.full_name.split(' ')[0]}</span>
                                {e.time && <span className="opacity-60 ml-auto">{e.time}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-surface border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Header Calendario */}
            <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{monthNames[month]} {year}</h2>
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-0.5">Calendario Maestro de Élite</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-black border border-zinc-800 rounded-lg p-1 mr-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-400 border-r border-zinc-800">
                            <CreditCard size={12} /> PAGOS
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-400 border-r border-zinc-800">
                            <Video size={12} /> VIDEO
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-400">
                            <Activity size={12} /> CONTROL
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-xs font-bold hover:text-white transition-all">
                            HOY
                        </button>
                        <button onClick={nextMonth} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid de Días de la Semana */}
            <div className="grid grid-cols-7 bg-zinc-900/40 border-b border-zinc-900">
                {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
                    <div key={d} className="py-3 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid del Calendario */}
            <div className="grid grid-cols-7 bg-black">
                {loading ? (
                    <div className="col-span-7 h-96 flex flex-col items-center justify-center gap-3 text-zinc-500">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Sincronizando agenda...</span>
                    </div>
                ) : renderDays()}
            </div>

            {/* Footer / Resumen */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {students.length} Alumnos Monitoreados</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} /> Automización de Fechas Activa</span>
                </div>
                <span>Versión Marketing OS 2.1</span>
            </div>
        </div>
    );
};

export default MasterCalendar;
