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
            setGeneratedPlan(plan);
        } catch (error) {
            console.error("Error generating plan:", error);
            alert("Error al generar el plan con IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportPDF = () => {
        if (!generatedPlan) return;
        setIsExporting(true);

        const element = document.getElementById('pdf-content');
        const opt = {
            margin: [0, 0],
            filename: `Elite_Plan_${selectedStudent.full_name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true,
                letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setIsExporting(false);
        }).catch(err => {
            console.error("PDF Export Error:", err);
            setIsExporting(false);
            alert("Error al generar el PDF.");
        });
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
                        <div id="pdf-content" style={{ width: '800px', backgroundColor: '#fff', color: '#1a1a1a', fontFamily: 'Arial, sans-serif' }}>
                            {/* Magazine Header */}
                            <div style={{ backgroundColor: '#7c3aed', padding: '60px 40px', color: '#fff', textAlign: 'center' }}>
                                <p style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8 }}>Protocolo de Alto Rendimiento</p>
                                <h1 style={{ fontSize: '48px', fontWeight: '900', textTransform: 'uppercase', margin: 0, fontStyle: 'italic', letterSpacing: '-1px' }}>
                                    {selectedStudent.goal === 'cut' ? 'Sredded' : selectedStudent.goal === 'bulk' ? 'Titan' : 'Elite'} Profile
                                </h1>
                                <div style={{ height: '4px', width: '60px', backgroundColor: '#fff', margin: '25px auto' }}></div>
                                <p style={{ fontSize: '18px', fontWeight: '700' }}>Alumno: {selectedStudent.full_name}</p>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '40px' }}>
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', borderLeft: '8px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px' }}>Protocolo Nutricional</h2>
                                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#3f3f46' }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedPlan.nutrition_plan}</ReactMarkdown>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid #e4e4e7', pt: '40px' }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', borderLeft: '8px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px' }}>Sistema de Entrenamiento</h2>
                                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#3f3f46' }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedPlan.training_plan}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ backgroundColor: '#f9fafb', padding: '30px 40px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', margin: 0 }}>Marketing OS - Coaching Automático de Clase Mundial</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanGenerator;
