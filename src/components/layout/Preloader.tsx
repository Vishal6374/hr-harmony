import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps {
    loading?: boolean;
}

export default function Preloader({ loading = false }: PreloaderProps) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setShow(false), 500);
            return () => clearTimeout(timer);
        } else {
            setShow(true);
        }
    }, [loading]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
                >
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 mb-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "linear",
                                }}
                                className="absolute inset-0 rounded-full border-4 border-t-black border-r-gray-200 border-b-gray-200 border-l-gray-200"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-2xl">
                                    C
                                </div>
                            </div>
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400"
                        >
                            Loading
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
