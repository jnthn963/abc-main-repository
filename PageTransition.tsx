// Import necessary libraries and components
import { motion } from 'framer-motion';

const PageTransition = () => {
    return (
        <motion.div
            initial={{ height: 0 }} // Removed scale: 0.98
            animate={{ height: '100%' }}
            exit={{ height: 0 }} // Removed scale: 0.98
            transition={{ duration: 0.5 }}
        >
            {/* Your content goes here */}
        </motion.div>
    );
};

export default PageTransition;