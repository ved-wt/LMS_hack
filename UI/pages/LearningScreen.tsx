import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CurrentUser } from '../types';
import {
  ChevronLeft,
  Menu,
  PlayCircle,
  FileText,
  CheckCircle,
  Circle,
  ChevronRight,
  Maximize2,
  HelpCircle,
  AlertCircle,
  RefreshCcw,
  Check
} from 'lucide-react';

interface LearningScreenProps {
  user: CurrentUser;
}

const LearningScreen: React.FC<LearningScreenProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [training, setTraining] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Default to first lesson of first module
  const [activeModuleId, setActiveModuleId] = useState('');
  const [activeLessonId, setActiveLessonId] = useState('');

  // Track completed lessons
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // Quiz State
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const fetchTraining = async () => {
      if (!id) return;
      try {
        const data = await api.trainings.get(id);
        setTraining(data || null);
        if (data && data.modules && data.modules.length > 0) {
          setActiveModuleId(data.modules[0].id);
          if (data.modules[0].lessons && data.modules[0].lessons.length > 0) {
            setActiveLessonId(data.modules[0].lessons[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch training", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [id]);

  // Fetch progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!id) return;
      try {
        const progress = await api.progress.getTrainingProgress(id);
        setCompletedLessons(new Set(progress.completed_lessons));
      } catch (e) {
        console.error("Failed to fetch progress", e);
      }
    };
    fetchProgress();
  }, [id]);

  // Reset quiz state when changing lessons
  useEffect(() => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [activeLessonId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!training) return <div>Course not found</div>;

  const activeModule = training.modules?.find(m => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons.find(l => l.id === activeLessonId);

  // Calculate progress based on completed lessons
  const totalLessons = training.modules?.reduce((acc: any, m: any) => acc + m.lessons.length, 0) || 0;
  // Ensure at least some progress is shown if enrolled, or just strictly based on completed lessons
  const progress = Math.min(100, Math.max(5, (completedLessons.size / totalLessons) * 100));

  // Logic to handle navigation to the next lesson
  const handleNextLesson = () => {
    if (!training.modules) return;

    const currentModuleIndex = training.modules.findIndex(m => m.id === activeModuleId);
    if (currentModuleIndex === -1) return;

    const currentModule = training.modules[currentModuleIndex];
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === activeLessonId);

    // Check if there is a next lesson in the current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setActiveLessonId(currentModule.lessons[currentLessonIndex + 1].id);
    }
    // Check if there is a next module
    else if (currentModuleIndex < training.modules.length - 1) {
      const nextModule = training.modules[currentModuleIndex + 1];
      if (nextModule.lessons.length > 0) {
        setActiveModuleId(nextModule.id);
        setActiveLessonId(nextModule.lessons[0].id);
      }
    }
  };

  // Mark current lesson as completed
  const markAsCompleted = async (score: number = 0) => {
    if (!activeLessonId) return;

    // Optimistic update
    setCompletedLessons(prev => {
      const newSet = new Set(prev);
      newSet.add(activeLessonId);
      return newSet;
    });

    try {
      await api.progress.completeLesson(activeLessonId, score);
    } catch (e) {
      console.error("Failed to save progress", e);
      // Revert if failed? For now, just log.
    }
  };

  // Handle video completion
  const handleVideoEnded = () => {
    markAsCompleted();
  };

  // Handle Quiz Submission
  const handleSubmitQuiz = () => {
    if (!activeLesson?.questions) return;

    let correctCount = 0;
    activeLesson.questions.forEach((q: any, idx: number) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / activeLesson.questions.length) * 100;
    setQuizScore(score);
    setQuizSubmitted(true);

    if (score >= 70) {
      markAsCompleted(score);
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Determine if it is the last lesson to disable the button or show a different state
  const isLastLesson = (() => {
    if (!training.modules || training.modules.length === 0) return true;
    const lastModule = training.modules[training.modules.length - 1];
    if (!lastModule || !lastModule.lessons || lastModule.lessons.length === 0) return true;
    const lastLesson = lastModule.lessons[lastModule.lessons.length - 1];
    return activeLessonId === lastLesson.id;
  })();

  const renderContent = () => {
    if (!activeLesson) return null;

    switch (activeLesson.type) {
      case 'VIDEO':
        return (
          <div className="aspect-video bg-black rounded-xl shadow-lg relative group overflow-hidden">
            <video
              key={activeLesson.id}
              className="w-full h-full object-cover"
              controls
              autoPlay
              src={activeLesson.content_url || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
              onEnded={handleVideoEnded}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'QUIZ':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <HelpCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{activeLesson.title}</h2>
                <p className="text-slate-500 text-sm">Pass the quiz to complete this lesson.</p>
              </div>
            </div>

            {!quizSubmitted ? (
              <div className="space-y-8">
                {activeLesson.questions?.map((question, index) => (
                  <div key={question.id} className="space-y-3">
                    <p className="font-semibold text-slate-800 text-lg">
                      <span className="text-slate-400 mr-2">{index + 1}.</span>
                      {question.text}
                    </p>
                    <div className="space-y-2 pl-6">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${userAnswers[question.id] === optIndex
                            ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                            checked={userAnswers[question.id] === optIndex}
                            onChange={() => setUserAnswers(prev => ({ ...prev, [question.id]: optIndex }))}
                          />
                          <span className="text-slate-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={!activeLesson.questions || Object.keys(userAnswers).length < activeLesson.questions.length}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit Answers
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 animate-in fade-in duration-500">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${quizScore >= 70 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                  {quizScore >= 70 ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {quizScore >= 70 ? 'Quiz Passed!' : 'Needs Improvement'}
                </h3>
                <p className="text-slate-500 mb-6">
                  You scored <span className="font-bold text-slate-900">{Math.round(quizScore)}%</span>
                </p>

                {quizScore < 70 ? (
                  <button
                    onClick={handleRetryQuiz}
                    className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <RefreshCcw size={18} /> Retry Quiz
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-emerald-600 font-medium">Great job! This lesson is now marked as complete.</p>
                    {!isLastLesson && (
                      <button
                        onClick={handleNextLesson}
                        className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Continue to Next Lesson <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'TEXT':
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[400px] flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
              <FileText size={48} className="mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Text Content</h3>
              <p className="max-w-md">This is a placeholder for text-based lessons. In a real application, this would render Markdown or rich HTML content.</p>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => markAsCompleted()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Check size={18} /> Mark as Completed
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] -m-4 md:-m-8">
      {/* Learning Toolbar */}
      <div className="bg-slate-900 text-white px-4 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/my-learning" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-semibold text-sm md:text-base line-clamp-1">{training.title}</h1>
            <div className="w-32 md:w-48 h-1.5 bg-white/20 rounded-full mt-1">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Menu size={20} />
          <span className="hidden md:inline">{sidebarOpen ? 'Hide' : 'Show'} Syllabus</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            {activeLesson ? (
              <div className="space-y-6">
                {/* Content Viewer (Video/Quiz/Text) */}
                {renderContent()}

                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeLesson.title}</h2>
                    <p className="text-slate-500">Module: {activeModule?.title}</p>
                  </div>
                  {/* Only show next button here if it's NOT a quiz (quiz shows it in result screen) */}
                  {activeLesson.type !== 'QUIZ' && (
                    <button
                      onClick={handleNextLesson}
                      disabled={isLastLesson}
                      className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLastLesson ? 'Course Completed' : 'Next Lesson'} <ChevronRight size={18} />
                    </button>
                  )}
                </div>

                {activeLesson.type === 'VIDEO' && (
                  <div className="prose prose-slate max-w-none">
                    <h3>About this lesson</h3>
                    <p>
                      {activeLesson.content_text || "In this lesson, we will explore the fundamental concepts to help you master this topic. Watch the video above and follow along with the exercises."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Select a lesson to start learning
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`bg-white border-l border-slate-200 w-80 shrink-0 flex flex-col transition-all duration-300 absolute md:relative z-10 h-full right-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:w-0 md:translate-x-0 md:border-l-0'
            }`}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
            Course Content
          </div>
          <div className="flex-1 overflow-y-auto">
            {training.modules?.map((module, mIdx) => (
              <div key={module.id} className="border-b border-slate-50">
                <div className="px-4 py-3 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Module {mIdx + 1}: {module.title}
                </div>
                <div>
                  {module.lessons.map((lesson, lIdx) => {
                    const isActive = lesson.id === activeLessonId;
                    const isCompleted = completedLessons.has(lesson.id);
                    let Icon = Circle;
                    if (isCompleted) Icon = CheckCircle;
                    else if (lesson.type === 'QUIZ') Icon = HelpCircle;
                    else if (lesson.type === 'VIDEO') Icon = PlayCircle;
                    else Icon = FileText;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setActiveModuleId(module.id);
                          setActiveLessonId(lesson.id);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${isActive ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
                          }`}
                      >
                        <div className="mt-0.5 text-slate-400">
                          {isCompleted ? <CheckCircle size={16} className="text-emerald-500" /> : <Circle size={16} />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {lIdx + 1}. {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            {lesson.type === 'VIDEO' && <PlayCircle size={12} />}
                            {lesson.type === 'QUIZ' && <HelpCircle size={12} />}
                            {lesson.type === 'TEXT' && <FileText size={12} />}
                            <span>{lesson.duration_minutes} min</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningScreen;
