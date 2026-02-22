import React, { useState, useEffect } from 'react';
import { Sparkles, Download, FileText, Check, Loader2, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';
import { MOCK_STUDENT } from '../lib/mockData';

const PlanGenerator = ({ selectedStudent, macros, latestPlan, onSavePlan }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const isDemoMode = !selectedStudent;
    const activeStudent = selectedStudent || MOCK_STUDENT;
    // Si estamos en modo demo, usamos unos macros por defecto si no vienen
    const activeMacros = macros || { calories: 2500, protein: 180, fat: 70, carbs: 280 };

    // Cargar plan guardado si existe al cambiar de alumno
    useEffect(() => {
        if (latestPlan && latestPlan.nutrition_plan_text) {
            setGeneratedPlan({
                nutrition_plan: latestPlan.nutrition_plan_text,
                training_plan: latestPlan.training_plan_text
            });
        } else {
            setGeneratedPlan(null);
        }
    }, [selectedStudent, latestPlan]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Importar dinámicamente para evitar problemas de dependencias circulares si los hubiera
            const { generateFitnessPlan } = await import('../lib/openai');
            const plan = await generateFitnessPlan(activeStudent, activeMacros, latestPlan);

            // Forzar preservación del plan de entrenamiento existente e ignorar alucinaciones del LLM
            setGeneratedPlan({
                ...plan,
                training_plan: latestPlan?.training_plan_text || null
            });
        } catch (error) {
            console.error("Error generating plan:", error);
            alert(`Error al generar el plan con IA: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportPDF = async () => {
        if (!generatedPlan) return;
        setIsExporting(true);

        const element = document.getElementById('pdf-content');
        const opt = {
            margin: 10,
            filename: `Elite_Plan_${activeStudent.full_name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 1.5,
                backgroundColor: '#ffffff',
                useCORS: true,
                windowWidth: 720
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], avoid: '.pdf-section' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error("PDF Export Error:", err);
            alert(`Error al generar el PDF. Detalle: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleConfirm = async () => {
        if (!generatedPlan) return;

        try {
            await onSavePlan({
                student_id: selectedStudent.id,
                calories: macros.calories,
                protein_g: macros.protein,
                fat_g: macros.fat,
                carbs_g: macros.carbs,
                goal: selectedStudent.goal,
                nutrition_plan_text: generatedPlan.nutrition_plan,
                training_plan_text: generatedPlan.training_plan
            });
            alert("Plan guardado exitosamente en el historial del alumno.");
        } catch (error) {
            console.error("Error saving plan:", error);
            alert("Error al guardar el plan.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-zinc-900 p-8 rounded-xl text-center space-y-4">
                <Sparkles className="mx-auto text-primary" size={48} />
                <h3 className="text-xl font-bold text-white">Generador de Planes IA</h3>
                <p className="text-zinc-500 max-w-lg mx-auto">
                    Utiliza nuestra inteligencia artificial para redactar protocolos de entrenamiento y nutrición 100% personalizados basados en los datos de {selectedStudent?.full_name || 'tu alumno'}.
                </p>
                <button
                    disabled={isGenerating}
                    onClick={handleGenerate}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 mx-auto ${isGenerating
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20'
                        }`}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generando Plan Maestro...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            {isDemoMode ? "Probar Generador con IA" : "Generar Plan Completo"}
                        </>
                    )}
                </button>
            </div>

            {generatedPlan && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileText className="text-primary" />
                            Propuesta de Plan
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                Descargar PDF
                            </button>
                            {!isDemoMode && (
                                <button
                                    onClick={handleConfirm}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    <Check size={18} />
                                    Confirmar y Guardar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Simple Target Header */}
                    {macros && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/70 mb-1">Calorías Diarias</p>
                                <p className="text-2xl font-black text-white">{macros.calories || 0}<span className="text-xs ml-1 opacity-50">kcal</span></p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Hidratación</p>
                                <p className="text-lg font-black text-white">2 Litros</p>
                                <p className="text-[10px] text-zinc-600 mt-1">Mínimo diario</p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Actividad</p>
                                <p className="text-lg font-black text-white">8,000 Pasos</p>
                                <p className="text-[10px] text-zinc-600 mt-1">Meta diaria</p>
                            </div>
                        </div>
                    )}

                    <div id="printable-plan" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Nutrition Plan */}
                        <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                                <h4 className="font-bold text-white flex items-center gap-2 uppercase tracking-wider text-xs">
                                    🍎 Plan Nutricional
                                </h4>
                            </div>
                            <div className="p-6 prose prose-invert prose-sm max-w-none text-zinc-400 overflow-y-auto max-h-[500px]">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedPlan.nutrition_plan}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Training Plan */}
                        <div className="bg-surface border border-zinc-900 rounded-xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                                <h4 className="font-bold text-white flex items-center gap-2 uppercase tracking-wider text-xs">
                                    💪 Plan de Entrenamiento
                                </h4>
                            </div>
                            <div className="p-6 prose prose-invert prose-sm max-w-none text-zinc-400 overflow-y-auto max-h-[500px]">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedPlan.training_plan}</ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Hidden Copy for PDF (Elite Magazine Style) */}
                    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                        <div id="pdf-content" style={{ width: '720px', backgroundColor: '#fff', color: '#1a1a1a', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            <style dangerouslySetInnerHTML={{
                                __html: `
                            #pdf-content * { color: #1a1a1a !important; border-color: #eeeeee !important; }
                            #pdf-content .text-primary { color: #7c3aed !important; }
                            #pdf-content h1, #pdf-content h2 { color: #4c1d95 !important; }
                        `}} />

                            <style>{`
                                .pdf-content-body h1, .pdf-content-body h2, .pdf-content-body h3, .pdf-content-body h4 { 
                                    color: #4c1d95 !important; 
                                    margin-top: 30px !important; 
                                    margin-bottom: 15px !important; 
                                    font-weight: 800 !important; 
                                    page-break-after: avoid !important;
                                    break-after: avoid !important;
                                }
                                .pdf-content-body h1 { fontSize: 22px !important; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; }
                                .pdf-content-body h2 { fontSize: 20px !important; color: #6d28d9 !important; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
                                .pdf-content-body h3 { fontSize: 18px !important; color: #7c3aed !important; }
                                .pdf-content-body p { margin-bottom: 10px !important; orphans: 4; widows: 4; }
                                .pdf-content-body ul, .pdf-content-body ol { margin-bottom: 15px !important; padding-left: 20px !important; page-break-inside: avoid !important; break-inside: avoid !important; }
                                .pdf-content-body li { margin-bottom: 8px !important; }
                                .pdf-content-body strong { color: #000 !important; font-weight: bold !important; }
                                .pdf-content-body table { 
                                    width: 100% !important; 
                                    border-collapse: collapse !important; 
                                    margin: 20px 0 !important; 
                                    font-size: 11px !important; 
                                    page-break-inside: avoid !important;
                                    break-inside: avoid !important;
                                    table-layout: fixed !important;
                                }
                                .pdf-content-body th { background-color: #f3f4f6 !important; padding: 10px 5px !important; text-align: left !important; border: 1px solid #d1d5db !important; font-weight: 800 !important; text-transform: uppercase !important; font-size: 10px !important; }
                                .pdf-content-body td { padding: 8px 5px !important; border: 1px solid #e5e7eb !important; word-wrap: break-word !important; }
                                .pdf-content-body tr { 
                                    page-break-inside: avoid !important;
                                    break-inside: avoid !important;
                                }
                                /* Grupo de comida para evitar saltos */
                                .pdf-content-body h3 + p, 
                                .pdf-content-body h3 + ul,
                                .pdf-content-body h3 + table {
                                    page-break-before: avoid !important;
                                    break-before: avoid !important;
                                }
                                .pdf-content-body blockquote { border-left: 4px solid #7c3aed !important; padding-left: 15px !important; color: #4b5563 !important; font-style: italic !important; margin: 20px 0 !important; }
                            `}</style>
                            {/* Magazine Header */}
                            <div style={{ backgroundColor: '#7c3aed', padding: '60px 40px', color: '#fff', textAlign: 'center' }}>
                                <p style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8 }}>ALFREDO TERRAZA</p>
                                <h1 style={{ fontSize: '48px', fontWeight: '900', textTransform: 'uppercase', margin: 0, fontStyle: 'italic', letterSpacing: '-1px' }}>
                                    {selectedStudent.goal === 'cut' ? 'Definición' : selectedStudent.goal === 'bulk' ? 'Volumen' : 'Elite'} Profile
                                </h1>
                                <div style={{ height: '4px', width: '60px', backgroundColor: '#fff', margin: '25px auto' }}></div>
                                <p style={{ fontSize: '18px', fontWeight: '700' }}>Alumno: {selectedStudent.full_name}</p>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '0 40px 40px 40px' }}>
                                {/* Summary Metrics for PDF */}
                                {macros && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '15px',
                                        marginBottom: '30px',
                                        background: '#f8fafc',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Calorías</p>
                                            <p style={{ fontSize: '20px', fontWeight: '900', color: '#7c3aed', margin: 0 }}>{macros.calories} <span style={{ fontSize: '10px', opacity: 0.7 }}>kcal</span></p>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                                            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Hidratación</p>
                                            <p style={{ fontSize: '18px', fontWeight: '900', color: '#1a1a1a', margin: 0 }}>2 Litros</p>
                                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0 0' }}>Mínimo diario</p>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                                            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Actividad</p>
                                            <p style={{ fontSize: '18px', fontWeight: '900', color: '#1a1a1a', margin: 0 }}>8,000 Pasos</p>
                                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0 0' }}>Meta diaria</p>
                                        </div>
                                    </div>
                                )}

                                {/* Metrics Bar */}
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', borderBottom: '2px solid #f4f4f5', paddingBottom: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '10px', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', margin: 0 }}>Objetivo</p>
                                        <p style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{selectedStudent.goal.toUpperCase()}</p>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '10px', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', margin: 0 }}>Calorías Base</p>
                                        <p style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{macros.calories} kcal</p>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '10px', fontWeight: '900', color: '#71717a', textTransform: 'uppercase', margin: 0 }}>Macros</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>P: {macros.protein}g | G: {macros.fat}g | C: {macros.carbs}g</p>
                                    </div>
                                </div>

                                {/* Content Sections */}
                                <div style={{ display: 'block', width: '100%' }}>
                                    <div style={{ marginBottom: '40px' }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', borderLeft: '8px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px', pageBreakAfter: 'avoid' }}>Protocolo Nutricional</h2>
                                        <div className="pdf-content-body" style={{ fontSize: '14px', lineHeight: '1.6', color: '#3f3f46' }}>
                                            {(() => {
                                                const text = generatedPlan.nutrition_plan || '';
                                                const rawSections = text.split(/(?=^#{2,3}\s)/m);
                                                const sections = [];

                                                for (let i = 0; i < rawSections.length; i++) {
                                                    let section = rawSections[i];
                                                    if (!section.trim()) continue;

                                                    const lines = section.trim().split('\n');
                                                    if (lines.length === 1 && lines[0].startsWith('#') && i < rawSections.length - 1) {
                                                        rawSections[i + 1] = section + rawSections[i + 1];
                                                        continue;
                                                    }
                                                    sections.push(section);
                                                }

                                                return sections.map((section, idx) => {
                                                    const isFirst = idx === 0;
                                                    return (
                                                        <div key={idx} className={isFirst ? "" : "pdf-section"} style={{
                                                            pageBreakInside: isFirst ? 'auto' : 'avoid',
                                                            breakInside: isFirst ? 'auto' : 'avoid',
                                                            marginBottom: '20px',
                                                            display: 'block'
                                                        }}>
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '2px solid #e4e4e7', paddingTop: '40px', pageBreakBefore: 'auto' }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', borderLeft: '8px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px', pageBreakAfter: 'avoid' }}>Sistema de Entrenamiento</h2>
                                        <div className="pdf-content-body" style={{ fontSize: '14px', lineHeight: '1.6', color: '#3f3f46' }}>
                                            {(() => {
                                                const text = generatedPlan.training_plan || '';
                                                const rawSections = text.split(/(?=^#{2,3}\s)/m);
                                                const sections = [];

                                                for (let i = 0; i < rawSections.length; i++) {
                                                    let section = rawSections[i];
                                                    if (!section.trim()) continue;

                                                    const lines = section.trim().split('\n');
                                                    if (lines.length === 1 && lines[0].startsWith('#') && i < rawSections.length - 1) {
                                                        rawSections[i + 1] = section + rawSections[i + 1];
                                                        continue;
                                                    }
                                                    sections.push(section);
                                                }

                                                return sections.map((section, idx) => {
                                                    const isFirst = idx === 0;
                                                    return (
                                                        <div key={idx} className={isFirst ? "" : "pdf-section"} style={{
                                                            pageBreakInside: isFirst ? 'auto' : 'avoid',
                                                            breakInside: isFirst ? 'auto' : 'avoid',
                                                            marginBottom: '20px',
                                                            display: 'block'
                                                        }}>
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ backgroundColor: '#f9fafb', padding: '30px 40px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', margin: 0 }}>Alfredo Terraza • Asesor de Nutrición y Entrenamiento</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanGenerator;
