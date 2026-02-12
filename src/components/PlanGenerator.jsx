import React, { useState } from 'react';
import { Sparkles, Download, FileText, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

const PlanGenerator = ({ selectedStudent, macros, onSavePlan }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleGenerate = async () => {
        if (!selectedStudent) {
            alert("Selecciona un alumno primero.");
            return;
        }

        setIsGenerating(true);
        try {
            // Importar dinámicamente para evitar problemas de dependencias circulares si los hubiera
            const { generateFitnessPlan } = await import('../lib/openai');
            const plan = await generateFitnessPlan(selectedStudent, macros);
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
            margin: [15, 15],
            filename: `Plan_Fitness_${selectedStudent.full_name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
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
                    disabled={isGenerating || !selectedStudent}
                    onClick={handleGenerate}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 mx-auto ${isGenerating || !selectedStudent
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
                            Generar Plan Completo
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
                            <button
                                onClick={handleConfirm}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Check size={18} />
                                Confirmar y Guardar
                            </button>
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
                                <ReactMarkdown>{generatedPlan.nutrition_plan}</ReactMarkdown>
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
                                <ReactMarkdown>{generatedPlan.training_plan}</ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Hidden Copy for PDF (Light Theme optimized) - Off-screen instead of display:none */}
                    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                        <div id="pdf-content" style={{ width: '800px', padding: '60px', color: '#000', backgroundColor: '#fff', fontFamily: 'sans-serif', lineBreak: 'auto' }}>
                            <h1 style={{ color: '#7c3aed', marginBottom: '20px' }}>Plan Fitness Personalizado</h1>
                            <p><strong>Alumno:</strong> {selectedStudent.full_name}</p>
                            <p><strong>Objetivo:</strong> {selectedStudent.goal}</p>
                            <hr style={{ margin: '20px 0' }} />
                            <div style={{ marginBottom: '40px' }}>
                                <h2 style={{ color: '#7c3aed' }}>Nutrición</h2>
                                <div className="markdown-pdf">
                                    <ReactMarkdown>{generatedPlan.nutrition_plan}</ReactMarkdown>
                                </div>
                            </div>
                            <div>
                                <h2 style={{ color: '#7c3aed' }}>Entrenamiento</h2>
                                <div className="markdown-pdf">
                                    <ReactMarkdown>{generatedPlan.training_plan}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanGenerator;
