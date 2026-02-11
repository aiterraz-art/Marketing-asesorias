import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, PlusCircle, Trash2, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { generateChatResponse, extractCalendarEvents } from '../lib/openai';
import { supabase } from '../lib/supabase';

export default function AIChatAssistant() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const messagesEndRef = useRef(null);
    const [initialLoad, setInitialLoad] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function fetchHistory() {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setMessages(data);
            } else {
                setMessages([{ role: 'assistant', content: '¡Hola! Soy tu socio estratégico para tu marca fitness. ¿En qué nos enfocamos hoy: Crear contenido, Meta Ads o Ventas?' }]);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setInitialLoad(false);
        }
    }

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            await supabase.from('chat_messages').insert([userMsg]);

            const responseText = await generateChatResponse(newMessages);
            const aiMsg = { role: 'assistant', content: responseText };

            await supabase.from('chat_messages').insert([aiMsg]);
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: '🚨 Error de conexión. Verifica tu API Key o conexión a internet.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncToCalendar = async () => {
        if (messages.length < 2) return;
        setExtracting(true);
        try {
            // 1. Extract events from chat history
            const result = await extractCalendarEvents(messages);
            const events = result.events || result.items || result;

            if (!Array.isArray(events) || events.length === 0) {
                alert("No detecté contenido claro para agendar. Pídeme primero que planifique algo.");
                return;
            }

            // 2. Save to Supabase with Full Details
            const eventsToSave = events.map(e => ({
                title: e.title,
                type: e.type || 'post',
                status: e.status || 'idea',
                script_content: e.script_content,
                production_plan: e.production_plan, // New field for filming instructions
                scheduled_date: e.scheduled_date || new Date().toISOString(), // Includes time if extracted
                idea_prompt: "Extracted from Chat Automation"
            }));

            const { error } = await supabase.from('content_items').insert(eventsToSave);

            if (error) throw error;

            // 3. Notify User via Chat
            const successMsg = {
                role: 'assistant',
                content: `✅ **Sincronización Completada**\n\nHe agendado **${events.length} piezas de contenido** con sus guiones y planes de grabación.\n\nPuedes ver los detalles completos en la pestaña **Calendario** o **Generador**.`
            };
            await supabase.from('chat_messages').insert([successMsg]);
            setMessages(prev => [...prev, successMsg]);

        } catch (error) {
            console.error('Sync Error:', error);
            alert('Hubo un error al sincronizar con el calendario.');
        } finally {
            setExtracting(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('¿Estás seguro de querer borrar toda la memoria del chat?')) return;
        try {
            const { error: deleteError } = await supabase.from('chat_messages').delete().gt('id', -1);
            if (deleteError) throw deleteError;
            setMessages([{ role: 'assistant', content: 'Memoria borrada. Empecemos de nuevo.' }]);
        } catch (err) {
            console.error('Failed to clear history', err);
            alert('No se pudo borrar el historial.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (initialLoad) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-surface border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in relative">

            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary to-orange-600 rounded-lg">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white">Estratega Fitness IA</h2>
                        <p className="text-xs text-zinc-400">Objetivo: Ventas & Comunidad</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncToCalendar}
                        disabled={extracting || loading}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 transition-all disabled:opacity-50 hover:border-primary hover:text-white"
                        title="Extraer contenido al Calendario"
                    >
                        {extracting ? <Loader2 size={14} className="animate-spin text-primary" /> : <CalendarCheck size={14} className="text-emerald-500" />}
                        {extracting ? 'Analizando...' : 'Agendar Contenido'}
                    </button>
                    <button
                        onClick={handleClearHistory}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Borrar Memoria"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700 mt-1">
                                <Sparkles size={14} className="text-primary" />
                            </div>
                        )}

                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/50'
                            }`}>
                            {msg.content}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                                <User size={14} className="text-zinc-400" />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 justify-start items-center">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                            <Loader2 size={14} className="text-primary animate-spin" />
                        </div>
                        <span className="text-xs text-zinc-500 animate-pulse">Analizando estrategia...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Pregunta sobre contenido, ads o estrategia..."
                        className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-4 pr-12 text-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder-zinc-600 transition-all font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-2 p-2 bg-primary hover:bg-orange-600 rounded-lg text-white transition-colors disabled:opacity-50 disabled:bg-zinc-700"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
