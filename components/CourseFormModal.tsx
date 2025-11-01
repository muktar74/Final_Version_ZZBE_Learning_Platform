
import React, { useState, useEffect, useRef } from 'react';
import { Course, Module, QuizQuestion, Toast, CourseCategory } from '../types';
import { generateCourseContent, generateQuiz, generateCourseFromText } from '../services/geminiService';
import { SparklesIcon, PlusIcon, TrashIcon, ArrowUpTrayIcon, VideoCameraIcon, BookOpenIcon as TextbookIcon, CameraIcon } from './icons';
import { supabase } from '../services/supabaseClient';
import ConfirmModal from './ConfirmModal';

// This library is loaded from a CDN script in index.html
declare const pdfjsLib: any;

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => Promise<void>;
  course: Course | null;
  addToast: (message: string, type: Toast['type']) => void;
  courseCategories: CourseCategory[];
}

type EditableModule = Module & { file?: File };

const CourseFormModal: React.FC<CourseFormModalProps> = ({ isOpen, onClose, onSave, course, addToast, courseCategories }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(courseCategories.length > 0 ? courseCategories[0].name : '');
  const [passingScore, setPassingScore] = useState(70);
  const [modules, setModules] = useState<EditableModule[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [textbookFile, setTextbookFile] = useState<File | null>(null);
  const [textbookUrl, setTextbookUrl] = useState<string | undefined>();
  const [textbookName, setTextbookName] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: () => {}, message: '' });
  
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const pdfGeneratorInputRef = useRef<HTMLInputElement>(null);
  const textbookInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    // Clean up any temporary blob URLs to prevent memory leaks
    modules.forEach(module => {
        if (module.content && module.content.startsWith('blob:')) {
            URL.revokeObjectURL(module.content);
        }
    });
    if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
    }
    if (textbookUrl && textbookUrl.startsWith('blob:')) {
        URL.revokeObjectURL(textbookUrl);
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (course) {
        setTitle(course.title);
        setDescription(course.description);
        setCategory(course.category || (courseCategories.length > 0 ? courseCategories[0].name : ''));
        setPassingScore(course.passingScore || 70);
        setModules(course.modules);
        setQuiz(course.quiz);
        setTextbookUrl(course.textbookUrl);
        setTextbookName(course.textbookName);
        setImageUrl(course.imageUrl);
      } else {
        // Reset form for new course
        setTitle('');
        setDescription('');
        setCategory(courseCategories.length > 0 ? courseCategories[0].name : '');
        setPassingScore(70);
        setModules([]);
        setQuiz([]);
        setTextbookUrl(undefined);
        setTextbookName(undefined);
        setImageUrl('');
      }
      setTextbookFile(null);
      setImageFile(null);
      setIsSaving(false);
      setIsGenerating(false);
    }
  }, [isOpen, course, courseCategories]);
  
  const confirmAndRunGenerator = (generatorFn: () => Promise<void>) => {
      const hasContent = description.trim() || modules.length > 0 || quiz.length > 0;
      if (hasContent) {
          setConfirmModal({
              isOpen: true,
              onConfirm: generatorFn,
              message: 'This will replace any existing description, modules, and quiz questions. Are you sure you want to proceed?'
          });
      } else {
          generatorFn();
      }
  };

  const handleGenerateWithAI = async () => {
    if (!title) {
        addToast("Please enter a course title to generate content with AI.", 'error');
        return;
    }
    setIsGenerating(true);
    addToast("Generating AI content... This may take a moment.", 'info');
    try {
        const content = await generateCourseContent(title);
        const allModuleContent = content.modules.map(m => m.content).join('\n\n');
        const quizQuestions = await generateQuiz(allModuleContent);

        setDescription(content.description);
        setModules(content.modules.map((m, i) => ({...m, id: `m-${Date.now()}-${i}`, type: 'text'})));
        setQuiz(quizQuestions);
        addToast("AI content and quiz generated successfully!", 'success');

    } catch (error: any) {
        console.error("Error generating content:", error);
        addToast(error.message || "Failed to generate content. Please try again.", 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateFromPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        addToast('Invalid file type. Please upload a PDF.', 'error');
        return;
    }

    setIsGenerating(true);
    addToast("Processing PDF and generating course... This may take several moments.", 'info');

    try {
        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
            try {
                const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
                
                if (typeof pdfjsLib.GlobalWorkerOptions.workerSrc === 'undefined') {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
                }

                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map((item: any) => item.str).join(' ');
                }

                if (!fullText.trim()) {
                    throw new Error("Could not extract text from the PDF.");
                }

                setTitle(file.name.replace('.pdf', ''));
                const content = await generateCourseFromText(fullText);
                const allModuleContent = content.modules.map(m => m.content).join('\n\n');
                const quizQuestions = await generateQuiz(allModuleContent);

                setDescription(content.description);
                setModules(content.modules.map((m, i) => ({...m, id: `m-${Date.now()}-${i}`, type: 'text'})));
                setQuiz(quizQuestions);
                addToast("Course successfully generated from PDF!", 'success');

            } catch (err: any) {
                 console.error("Error during PDF processing/AI generation:", err);
                 addToast(err.message || "An error occurred. Please try again.", 'error');
            } finally {
                setIsGenerating(false);
                if(pdfGeneratorInputRef.current) pdfGeneratorInputRef.current.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (error: any) {
        console.error("File Reader Error:", error);
        addToast(error.message || "Could not read the selected file.", 'error');
        setIsGenerating(false);
    }
  }
  
  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
        addToast("Invalid file type. Please upload a video file.", 'error');
        return;
    }
    
    // 50MB limit
    if (file.size > 50 * 1024 * 1024) { 
        addToast("Video file is too large. Please use a file smaller than 50MB.", 'error');
        return;
    }

    const newModules = [...modules];
    const oldModule = newModules[index];

    // If there was a previously staged file, revoke its object URL to prevent memory leaks
    if (oldModule.file && oldModule.content.startsWith('blob:')) {
        URL.revokeObjectURL(oldModule.content);
    }

    const objectUrl = URL.createObjectURL(file);
    newModules[index] = { ...oldModule, content: objectUrl, videoType: 'upload', file: file };
    setModules(newModules);
    
    // Reset file input to allow selecting the same file again
    if (event.target) event.target.value = "";
  };


  const handleModuleChange = (index: number, changes: Partial<EditableModule>) => {
    const newModules = [...modules];
    const oldModule = newModules[index];

    // If type is changing, reset content and videoType
    if (changes.type && oldModule.type !== changes.type) {
        changes.content = '';
        if (oldModule.file && oldModule.content.startsWith('blob:')) {
            URL.revokeObjectURL(oldModule.content);
        }
        changes.file = undefined;

        if (changes.type === 'video') {
            changes.videoType = 'embed';
        } else {
            delete changes.videoType;
        }
    }

    newModules[index] = { ...oldModule, ...changes };
    setModules(newModules);
  };


  const addModule = () => {
    setModules([...modules, { id: `m-new-${Date.now()}`, title: '', content: '', type: 'text' }]);
    setTimeout(() => modalBodyRef.current?.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };
  
  const addVideoModule = () => {
    setModules([...modules, { id: `m-new-${Date.now()}`, title: '', content: '', type: 'video', videoType: 'embed' }]);
    setTimeout(() => modalBodyRef.current?.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeModule = (index: number) => {
    const moduleToRemove = modules[index];

    if (moduleToRemove.file && moduleToRemove.content.startsWith('blob:')) {
        URL.revokeObjectURL(moduleToRemove.content);
    }
    
    addToast("Module removed. Changes will be saved when you submit the form.", "info");

    setModules(modules.filter((_, i) => i !== index));
  };

  const handleQuizChange = (qIndex: number, field: 'question' | 'options' | 'correctAnswer', value: string, optIndex?: number) => {
    const newQuiz = [...quiz];
    const question = newQuiz[qIndex];

    if (field === 'options' && optIndex !== undefined) {
      question.options[optIndex] = value;
    } else if (field === 'question') {
      question.question = value;
    } else if (field === 'correctAnswer') {
      question.correctAnswer = value;
    }
    setQuiz(newQuiz);
  };
  
  const addQuizQuestion = () => {
    setQuiz([...quiz, { question: '', options: ['True', 'False'], correctAnswer: '' }]);
     setTimeout(() => modalBodyRef.current?.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeQuizQuestion = (index: number) => {
    setQuiz(quiz.filter((_, i) => i !== index));
  };
  
  const addQuizOption = (qIndex: number) => {
    const newQuiz = [...quiz];
    if (newQuiz[qIndex].options.length >= 6) {
        addToast("A maximum of 6 options are allowed per question.", "info");
        return;
    }
    newQuiz[qIndex].options.push('');
    setQuiz(newQuiz);
  };

  const removeQuizOption = (qIndex: number, optIndex: number) => {
      const newQuiz = [...quiz];
      const question = newQuiz[qIndex];
      
      if (question.options.length <= 2) {
          addToast("A question must have at least 2 options.", "error");
          return;
      }
      
      const removedOption = question.options[optIndex];
      if (question.correctAnswer === removedOption) {
          question.correctAnswer = '';
      }
      
      question.options = question.options.filter((_, i) => i !== optIndex);
      setQuiz(newQuiz);
  };

  const handleTextbookSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        addToast('Invalid file type. Please upload a PDF.', 'error');
        return;
    }
    // 50MB limit
    if (file.size > 50 * 1024 * 1024) { 
        addToast("PDF file is too large. Please use a file smaller than 50MB.", 'error');
        return;
    }
    setTextbookFile(file);
    setTextbookName(file.name);
    if (textbookUrl && textbookUrl.startsWith('blob:')) {
        URL.revokeObjectURL(textbookUrl);
    }
    setTextbookUrl(URL.createObjectURL(file)); // For preview purposes
  };

  const handleRemoveTextbook = () => {
      setTextbookFile(null);
      setTextbookName(undefined);
      if (textbookUrl && textbookUrl.startsWith('blob:')) {
        URL.revokeObjectURL(textbookUrl);
      }
      setTextbookUrl(undefined);
      if(textbookInputRef.current) textbookInputRef.current.value = "";
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
    }
    setImageUrl('');
    if(imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        addToast('Invalid file type. Please upload an image.', 'error');
        return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        addToast("Image file is too large. Please use a file smaller than 2MB.", 'error');
        return;
    }
    if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
    }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };
  
  const getStoragePathFromUrl = (url: string | undefined): string | null => {
      if (!url || !url.includes('supabase.co')) return null;
      try {
          const urlObject = new URL(url);
          const pathName = urlObject.pathname;
          const bucketName = 'assets';
          const searchString = `/storage/v1/object/public/${bucketName}/`;
          
          if (pathName.includes(searchString)) {
              return decodeURIComponent(pathName.substring(pathName.indexOf(searchString) + searchString.length));
          }
          return null;
      } catch (e) {
          console.error("Could not parse URL for storage path:", url, e);
          return null;
      }
  };

  const uploadFile = async (file: File): Promise<{url: string; name: string}> => {
      addToast(`Uploading ${file.name}...`, 'info');
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `public/${Date.now()}-${safeFileName}`;
      const { data, error } = await supabase.storage.from('assets').upload(filePath, file);
      if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
      
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(data.path);
      return { url: urlData.publicUrl, name: file.name };
  };

  const deleteFileFromStorage = async (url: string | undefined) => {
    const path = getStoragePathFromUrl(url);
    if (path) {
        const { error } = await supabase.storage.from('assets').remove([path]);
        if (error) {
            console.error(`Could not delete old file from storage: ${path}`, error);
            addToast(`Warning: Failed to delete old file at ${path}`, 'error');
        }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
        addToast("Title and Description are required.", 'error');
        return;
    }
    if (passingScore < 0 || passingScore > 100) {
        addToast("Passing score must be between 0 and 100.", 'error');
        return;
    }
    if (courseCategories.length > 0 && !category) {
        addToast("Please select a category for the course.", "error");
        return;
    }

    setIsSaving(true);
    addToast("Saving course... please wait.", "info");

    try {
        // Handle Image
        let finalImageUrl = course?.imageUrl || '';
        if (imageFile) {
            if (course?.imageUrl) { await deleteFileFromStorage(course.imageUrl); }
            const { url } = await uploadFile(imageFile);
            finalImageUrl = url;
        } else if (!imageUrl && course?.imageUrl) { // Image was removed
             await deleteFileFromStorage(course.imageUrl);
             finalImageUrl = '';
        }

        // Handle Textbook
        let finalTbookUrl = course?.textbookUrl;
        let finalTbookName = course?.textbookName;
        if (textbookFile) {
            if (course?.textbookUrl) { await deleteFileFromStorage(course.textbookUrl); }
            const { url, name } = await uploadFile(textbookFile);
            finalTbookUrl = url;
            finalTbookName = name;
        } else if (!textbookUrl && course?.textbookUrl) { // Textbook was removed
            await deleteFileFromStorage(course.textbookUrl);
            finalTbookUrl = undefined;
            finalTbookName = undefined;
        }

        // Handle Video Modules
        const finalModules = await Promise.all(
            modules.map(async (module) => {
                if (module.type === 'video' && module.videoType === 'upload' && module.file) {
                    const originalModuleInDb = course?.modules.find(m => m.id === module.id);
                    if (originalModuleInDb?.content) {
                        await deleteFileFromStorage(originalModuleInDb.content);
                    }
                    const { url } = await uploadFile(module.file);
                    return { ...module, content: url, file: undefined }; // remove file before saving
                }
                return { ...module, file: undefined };
            })
        );
        
        const finalCourse: Course = {
            id: course?.id || '', // placeholder id
            title,
            description,
            category,
            passingScore,
            modules: finalModules,
            quiz,
            reviews: course?.reviews || [],
            discussion: course?.discussion || [],
            imageUrl: finalImageUrl,
            textbookUrl: finalTbookUrl,
            textbookName: finalTbookName,
        };

        await onSave(finalCourse);
        handleClose();

    } catch (error: any) {
        console.error("Error saving course:", error);
        addToast(error.message || "An unexpected error occurred while saving.", 'error');
    } finally {
        setIsSaving(false);
    }
  };


  if (!isOpen) return null;
  
  const formElementClasses = "w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold">{course ? 'Edit Course' : 'Create New Course'}</h2>
          <div className="flex items-center space-x-4">
            <button type="button" onClick={handleClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSaving || isGenerating} className="px-6 py-2 text-sm font-semibold text-white bg-zamzam-teal-600 rounded-md hover:bg-zamzam-teal-700 transition disabled:bg-slate-400">
              {isSaving ? 'Saving...' : (course ? 'Save Changes' : 'Create Course')}
            </button>
          </div>
        </div>
        
        {/* Main Body */}
        <div ref={modalBodyRef} className="p-6 flex-grow overflow-y-auto">
             {/* AI Generation Tools */}
             <div className="bg-zamzam-teal-50 border border-zamzam-teal-200 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-zamzam-teal-800 flex items-center mb-2"><SparklesIcon className="h-5 w-5 mr-2"/>AI Content Tools</h3>
                <p className="text-sm text-zamzam-teal-700 mb-4">Automatically generate course content, modules, and quizzes.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                     <button
                        type="button"
                        onClick={() => confirmAndRunGenerator(handleGenerateWithAI)}
                        disabled={isGenerating || !title}
                        className="flex-1 flex items-center justify-center bg-white text-zamzam-teal-700 font-semibold py-2 px-4 rounded-lg border border-zamzam-teal-600 hover:bg-zamzam-teal-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate from Title
                    </button>
                    <input type="file" ref={pdfGeneratorInputRef} onChange={(e) => confirmAndRunGenerator(() => handleGenerateFromPdf(e))} accept=".pdf" className="hidden"/>
                    <button
                        type="button"
                        onClick={() => pdfGeneratorInputRef.current?.click()}
                        disabled={isGenerating}
                        className="flex-1 flex items-center justify-center bg-white text-zamzam-teal-700 font-semibold py-2 px-4 rounded-lg border border-zamzam-teal-600 hover:bg-zamzam-teal-100 transition disabled:opacity-50"
                    >
                        Generate from PDF
                    </button>
                </div>
                {isGenerating && <p className="text-sm text-slate-600 mt-2 animate-pulse text-center">AI is working its magic...</p>}
            </div>

             {/* Course Details */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white" required />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Course Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white" required />
                </div>
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white" required>
                        {courseCategories.length === 0 && <option disabled>No categories available</option>}
                        {courseCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="passingScore" className="block text-sm font-medium text-slate-700 mb-1">Passing Score (%)</label>
                    <input type="number" id="passingScore" value={passingScore} onChange={(e) => setPassingScore(parseInt(e.target.value))} min="0" max="100" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white" required />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Course Image */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course Image</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <div className="w-32 h-20 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                                {imageUrl ? <img src={imageUrl} alt="Course preview" className="w-full h-full object-cover"/> : <CameraIcon className="h-8 w-8 text-slate-400"/>}
                            </div>
                            <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden"/>
                            <div>
                                <button type="button" onClick={() => imageInputRef.current?.click()} className="text-sm font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-800">Change</button>
                                {imageUrl && <button type="button" onClick={handleRemoveImage} className="ml-2 text-sm font-semibold text-red-600 hover:text-red-800">Remove</button>}
                            </div>
                        </div>
                    </div>
                    {/* Course Textbook */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course Textbook (PDF)</label>
                        <div className="mt-2">
                            <input type="file" ref={textbookInputRef} onChange={handleTextbookSelect} accept=".pdf" className="hidden"/>
                            {!textbookName ? (
                                <button type="button" onClick={() => textbookInputRef.current?.click()} className="flex items-center space-x-2 text-sm font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-800 border border-zamzam-teal-600 rounded-md px-3 py-1.5 transition">
                                    <ArrowUpTrayIcon className="h-4 w-4" />
                                    <span>Upload PDF</span>
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-md max-w-sm">
                                    <TextbookIcon className="h-5 w-5 text-slate-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-700 truncate flex-grow" title={textbookName}>{textbookName}</span>
                                    <button type="button" onClick={handleRemoveTextbook} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 flex-shrink-0">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules */}
            <div className="mt-8">
                <h3 className="text-lg font-bold">Modules</h3>
                {modules.map((module, index) => (
                    <div key={module.id} className="p-4 border rounded-md mt-4 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Module {index + 1}</h4>
                            <button type="button" onClick={() => removeModule(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Title</label>
                                <input type="text" value={module.title} onChange={(e) => handleModuleChange(index, { title: e.target.value })} className={formElementClasses} />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-sm font-medium text-slate-700">Type</label>
                                <select value={module.type} onChange={(e) => handleModuleChange(index, { type: e.target.value as 'text' | 'video' })} className={formElementClasses}>
                                    <option value="text">Text / HTML</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                         </div>
                         <div className="mt-2">
                            {module.type === 'text' ? (
                                <>
                                 <label className="text-sm font-medium text-slate-700">Content (HTML allowed)</label>
                                <textarea value={module.content} onChange={(e) => handleModuleChange(index, { content: e.target.value })} rows={5} className={formElementClasses} />
                                </>
                            ) : (
                                <>
                                <label className="text-sm font-medium text-slate-700">Video Source</label>
                                <select value={module.videoType} onChange={(e) => handleModuleChange(index, { videoType: e.target.value as 'embed' | 'upload'})} className={formElementClasses}>
                                    <option value="embed">Embed URL (YouTube, Vimeo, etc.)</option>
                                    <option value="upload">Upload Video File (Max 50MB)</option>
                                </select>
                                {module.videoType === 'embed' ? (
                                    <input type="url" value={module.content} placeholder="https://www.youtube.com/embed/..." onChange={(e) => handleModuleChange(index, { content: e.target.value })} className={`${formElementClasses} mt-2`} />
                                ) : (
                                    <div className="mt-2 p-4 border-2 border-dashed rounded-md text-center">
                                         <input type="file" onChange={(e) => handleVideoSelect(e, index)} accept="video/*" className="hidden" id={`video-upload-${index}`}/>
                                         <label htmlFor={`video-upload-${index}`} className="cursor-pointer text-zamzam-teal-600 font-semibold flex items-center justify-center">
                                            <ArrowUpTrayIcon className="h-5 w-5 mr-2"/>
                                            Choose a video file
                                         </label>
                                         {module.content && <p className="text-sm text-slate-500 mt-2">Current file: {module.file?.name || 'Uploaded Video'}</p>}
                                    </div>
                                )}
                                </>
                            )}
                         </div>
                    </div>
                ))}
                <div className="mt-4 flex items-center space-x-2">
                    <button type="button" onClick={addModule} className="text-sm font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-800 border border-zamzam-teal-600 rounded-md px-3 py-1">
                        + Add Text Module
                    </button>
                    <button type="button" onClick={addVideoModule} className="text-sm font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-800 border border-zamzam-teal-600 rounded-md px-3 py-1">
                        + Add Video Module
                    </button>
                </div>
            </div>
            
            {/* Quiz */}
             <div className="mt-8">
                <h3 className="text-lg font-bold">Quiz</h3>
                 {quiz.map((q, qIndex) => (
                    <div key={`q-${qIndex}`} className="p-4 border rounded-md mt-4 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Question {qIndex + 1}</h4>
                            <button type="button" onClick={() => removeQuizQuestion(qIndex)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                        <textarea value={q.question} onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)} placeholder="Question text" rows={2} className={formElementClasses} />
                        <h5 className="text-sm font-medium mt-2">Options</h5>
                        {q.options.map((opt, optIndex) => (
                            <div key={`opt-${qIndex}-${optIndex}`} className="flex items-center space-x-2 mt-1">
                                <input type="text" value={opt} onChange={(e) => handleQuizChange(qIndex, 'options', e.target.value, optIndex)} className={`${formElementClasses} !py-1`} />
                                <button type="button" onClick={() => removeQuizOption(qIndex, optIndex)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addQuizOption(qIndex)} className="text-xs font-semibold text-zamzam-teal-600 mt-1">+ Add Option</button>
                        <div className="mt-2">
                            <label className="text-sm font-medium text-slate-700">Correct Answer</label>
                            <select value={q.correctAnswer} onChange={(e) => handleQuizChange(qIndex, 'correctAnswer', e.target.value)} className={formElementClasses}>
                                <option value="" disabled>Select the correct answer</option>
                                {q.options.filter(o => o.trim()).map((opt, optIndex) => <option key={`corr-${qIndex}-${optIndex}`} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                 ))}
                 <button type="button" onClick={addQuizQuestion} className="mt-4 text-sm font-semibold text-zamzam-teal-600 hover:text-zamzam-teal-800 border border-zamzam-teal-600 rounded-md px-3 py-1">
                    + Add Question
                 </button>
            </div>
        </div>
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({isOpen: false, onConfirm: ()=>{}, message: ''})}
          onConfirm={confirmModal.onConfirm}
          title="Confirm AI Generation"
          message={confirmModal.message}
        />
      </form>
    </div>
  );
};

export default CourseFormModal;
