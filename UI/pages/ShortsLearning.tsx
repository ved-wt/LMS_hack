import React, { useState, useRef, useEffect } from 'react';
import { CurrentUser } from '../types';
import { Heart, MessageCircle, Share2, MoreVertical, Play, Pause, Bookmark } from 'lucide-react';

interface ShortContent {
    id: string;
    title: string;
    description: string;
    author: string;
    videoUrl?: string; // Optional, could be just text/image for now
    likes: number;
    comments: number;
    tags: string[];
}

const MOCK_SHORTS: ShortContent[] = [
    {
        id: '1',
        title: 'React Hooks in 60 Seconds',
        description: 'Master the useEffect hook with this quick tip! Remember to always check your dependency array.',
        author: 'Sarah Dev',
        likes: 1240,
        comments: 45,
        tags: ['React', 'Frontend', 'Tips'],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // Placeholder
    },
    {
        id: '2',
        title: 'Python List Comprehensions',
        description: 'Write cleaner code with list comprehensions. It\'s pythonic and faster!',
        author: 'PyMaster',
        likes: 890,
        comments: 22,
        tags: ['Python', 'Coding', 'Basics'],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
        id: '3',
        title: 'CSS Grid vs Flexbox',
        description: 'When to use which? Grid for 2D layouts, Flexbox for 1D. Here is a quick visual guide.',
        author: 'DesignPro',
        likes: 2100,
        comments: 105,
        tags: ['CSS', 'Design', 'Web'],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    }
];

const ShortCard: React.FC<{ content: ShortContent; isActive: boolean }> = ({ content, isActive }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isActive) {
            setIsPlaying(true);
            videoRef.current?.play().catch(e => console.log("Autoplay prevented", e));
        } else {
            setIsPlaying(false);
            videoRef.current?.pause();
            if (videoRef.current) videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="h-[80vh] w-full max-w-md mx-auto bg-black rounded-2xl overflow-hidden relative snap-start shrink-0 flex flex-col shadow-2xl my-4">
            {/* Video/Content Area */}
            <div className="flex-1 relative bg-slate-900 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                {content.videoUrl ? (
                    <video
                        ref={videoRef}
                        src={content.videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted // Muted for autoplay policy, usually user un-mutes
                        playsInline
                    />
                ) : (
                    <div className="p-8 text-white text-center">
                        <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
                        <p className="text-xl">{content.description}</p>
                    </div>
                )}

                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play size={64} className="text-white/80" fill="white" />
                    </div>
                )}
            </div>

            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 text-white">
                <div className="flex justify-between items-end">
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">
                                {content.author[0]}
                            </div>
                            <span className="font-semibold text-sm">{content.author}</span>
                            <button className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">
                                Follow
                            </button>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{content.title}</h3>
                        <p className="text-sm text-slate-200 line-clamp-2 mb-2">{content.description}</p>
                        <div className="flex flex-wrap gap-2">
                            {content.tags.map(tag => (
                                <span key={tag} className="text-xs bg-white/10 px-2 py-1 rounded-full">#{tag}</span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4 items-center">
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                <Heart size={24} className="group-hover:text-red-500 transition-colors" />
                            </div>
                            <span className="text-xs font-medium">{content.likes}</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                <MessageCircle size={24} />
                            </div>
                            <span className="text-xs font-medium">{content.comments}</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                <Bookmark size={24} />
                            </div>
                        </button>
                        <button className="flex flex-col items-center gap-1 group">
                            <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                <Share2 size={24} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShortsLearning: React.FC<{ user: CurrentUser }> = ({ user }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, clientHeight } = containerRef.current;
            const index = Math.round(scrollTop / clientHeight);
            // Since we have margin/spacing, calculation might be slightly off if not handled carefully.
            // Better approach for "snap" is IntersectionObserver, but simple scroll calc works for fixed height.
            // Actually, let's use IntersectionObserver for robustness if we had more time, 
            // but for now, let's assume the snap-y handles the positioning and we just detect which is mostly visible.

            // Let's rely on the center point.
            const center = scrollTop + clientHeight / 2;
            const children = containerRef.current.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLElement;
                if (child.offsetTop <= center && child.offsetTop + child.offsetHeight > center) {
                    setActiveIndex(i);
                    break;
                }
            }
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex justify-center overflow-hidden">
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar pb-20"
                onScroll={handleScroll}
            >
                <div className="flex flex-col items-center gap-8 py-4">
                    {MOCK_SHORTS.map((short, index) => (
                        <ShortCard
                            key={short.id}
                            content={short}
                            isActive={index === activeIndex}
                        />
                    ))}
                    <div className="h-20 flex items-center justify-center text-slate-400 snap-start">
                        <p>You've reached the end! 🎉</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShortsLearning;
