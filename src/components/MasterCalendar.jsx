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
    Clock,
    Plus,
    X,
    Check,
    Users
} from 'lucide-react';
import { updateStudentData } from '../lib/supabase';

const MasterCalendar = ({ onSelectStudent, students = [], onUpdate, loading }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [schedulingData, setSchedulingData] = useState({
        studentId: '',
        type: 'videocall',
        date: '',
        time: '12:00'
    });
    const [isSaving, setIsSaving] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

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

    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const handleOpenModal = (day = null) => {
        // Si se hace clic en un día específico, usamos ese. Si no, hoy.
        const targetDate = day ? new Date(year, month, day) : new Date();
        const dateStr = targetDate.toISOString().split('T')[0];

        setSchedulingData({
            ...schedulingData,
            date: dateStr
        });
        setSelectedDay(day);
        setIsModalOpen(true);
    };

    const handleQuickSchedule = async () => {
        if (!schedulingData.studentId || !schedulingData.date) {
            alert("Por favor selecciona un alumno y una fecha.");
            return;
        }

        setIsSaving(true);
        try {
            let updates = {};
            const dateStr = schedulingData.date;
            const selectedDate = new Date(dateStr);

            if (schedulingData.type === 'payment') {
                // El usuario está marcando que hoy (o el día seleccionado) se hizo un pago.
                // Por lo tanto, el pago actual es el 'last_payment_date'.
                // Y el sistema proyecta el 'next_payment_date' para 30 días después.
                const nextPayDate = new Date(selectedDate);
                nextPayDate.setDate(nextPayDate.getDate() + 30);

                updates = {
                    last_payment_date: dateStr,
                    next_payment_date: nextPayDate.toISOString().split('T')[0]
                };
            } else if (schedulingData.type === 'checkin') {
                updates = { next_checkin_date: dateStr };
            } else if (schedulingData.type === 'videocall') {
                const fullDateTime = new Date(`${dateStr}T${schedulingData.time}:00`).toISOString();

                // Al programar video:
                // 1. Programamos la video (next_videocall_date)
                // 2. Seteamos 4 controles restantes (remaining_checks)
                // 3. Programamos el PRIMER control para 7 días después de la video
                const firstCheckDate = new Date(selectedDate);
                firstCheckDate.setDate(firstCheckDate.getDate() + 7);

                updates = {
                    next_videocall_date: fullDateTime,
                    remaining_checks: 4,
                    next_checkin_date: firstCheckDate.toISOString().split('T')[0]
                };
            }

            await updateStudentData(schedulingData.studentId, updates);
            if (onUpdate) await onUpdate(); // Sincronizar con el dashboard
            setIsModalOpen(false);
            setSchedulingData({ studentId: '', type: 'videocall', date: '', time: '12:00' });
            alert(schedulingData.type === 'videocall'
                ? "Video llamada programada. Se han configurado 4 controles semanales automáticos."
                : "Hito programado correctamente");
        } catch (err) {
            console.error("Error saving schedule:", err);
            alert("Error al guardar la programación.");
        } finally {
            setIsSaving(false);
        }
    };

    // Mapear eventos por día
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
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 border border-zinc-900/50 bg-zinc-950/20"></div>);
        }

        for (let d = 1; d <= totalDays; d++) {
            const events = getEventsForDay(d);
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

            days.push(
                <div
                    key={d}
                    onClick={() => handleOpenModal(d)}
                    className={`h-32 border border-zinc-900/50 p-2 transition-colors hover:bg-zinc-900/20 group cursor-pointer ${isToday ? 'bg-primary/5' : 'bg-surface'}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-zinc-500'}`}>
                            {d}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={12} className="text-primary/70" />
                        </div>
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[90px] scrollbar-hide">
                        {events.map((e, idx) => (
                            <div
                                key={idx}
                                onClick={(ev) => { ev.stopPropagation(); onSelectStudent(e.student); }}
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
        <div className="bg-surface border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative">
            {/* Header Calendario */}
            <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{monthNames[month]} {year}</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Calendario Maestro de Élite</p>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            <button onClick={() => handleOpenModal()} className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1">
                                <Plus size={10} /> PROGRAMAR HITO
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex bg-black border border-zinc-800 rounded-lg p-1 mr-4">
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
            <div className="grid grid-cols-7 bg-black min-h-[400px] relative">
                {loading ? (
                    <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Sincronizando Alumnos...</span>
                    </div>
                ) : (
                    <>
                        {students.length === 0 && (
                            <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center pointer-events-none">
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                                    <Users size={32} className="text-zinc-600" />
                                    <p className="text-sm font-bold text-zinc-400">Sin alumnos registrados</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {renderDays()}
            </div>

            {/* Footer / Resumen */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {students.length} Alumnos Monitoreados</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} /> Sincronización Directa</span>
                </div>
                <span>Versión Marketing OS 2.4</span>
            </div>

            {/* Modal de Programación Rápida */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                    <Plus size={18} />
                                </div>
                                <h3 className="font-bold text-white">Programar Hito</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Alumno */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Alumno</label>
                                <select
                                    value={schedulingData.studentId}
                                    onChange={(e) => setSchedulingData({ ...schedulingData, studentId: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all cursor-pointer appearance-none"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                                >
                                    <option value="" className="bg-zinc-900 text-zinc-400">Seleccionar alumno...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                                            {s.full_name}
                                        </option>
                                    ))}
                                </select>
                                {students.length === 0 && !loading && (
                                    <p className="text-[9px] text-red-400 font-bold ml-1 italic">No hay alumnos disponibles</p>
                                )}
                            </div>

                            {/* Tipo */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setSchedulingData({ ...schedulingData, type: 'payment' })}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${schedulingData.type === 'payment' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <CreditCard size={18} />
                                    <span className="text-[9px] font-bold">PAGO</span>
                                </button>
                                <button
                                    onClick={() => setSchedulingData({ ...schedulingData, type: 'videocall' })}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${schedulingData.type === 'videocall' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <Video size={18} />
                                    <span className="text-[9px] font-bold">VIDEO</span>
                                </button>
                                <button
                                    onClick={() => setSchedulingData({ ...schedulingData, type: 'checkin' })}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${schedulingData.type === 'checkin' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    <Activity size={18} />
                                    <span className="text-[9px] font-bold">CONTROL</span>
                                </button>
                            </div>

                            {/* Fecha y Hora */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={schedulingData.date}
                                        onChange={(e) => setSchedulingData({ ...schedulingData, date: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Hora</label>
                                    <input
                                        type="time"
                                        value={schedulingData.time}
                                        onChange={(e) => setSchedulingData({ ...schedulingData, time: e.target.value })}
                                        disabled={schedulingData.type !== 'videocall'}
                                        className={`w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all ${schedulingData.type !== 'videocall' ? 'opacity-30' : ''}`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleQuickSchedule}
                                disabled={isSaving}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-2 shadow-xl shadow-primary/10"
                            >
                                {isSaving ? <Clock className="animate-spin" size={20} /> : <Check size={20} />}
                                {isSaving ? 'Guardando...' : 'Confirmar Programación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterCalendar;
