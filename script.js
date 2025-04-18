document.addEventListener('DOMContentLoaded', function() {
    // Get the elements
    const scrollText = document.getElementById('scrollText');
    const paragraphContainer = document.getElementById('paragraphContainer');
    const paragraphs = paragraphContainer.querySelectorAll('p');
    const thankYou = document.getElementById('thankYou');
    const container = document.querySelector('.container');
    const contentBox = document.querySelector('.content-box');
    
    // Speech synthesis setup
    const synth = window.speechSynthesis;
    let voices = [];
    let activeIndex = -1;
    let isReading = false;
    let scrollTimer;
    
    // Function to get available voices and select a good female voice
    function loadVoices() {
        voices = synth.getVoices();
        const preferredVoices = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Victoria', 'Ava'];
        
        for (const preferred of preferredVoices) {
            const voice = voices.find(v => v.name.includes(preferred));
            if (voice) return voice;
        }
        
        let femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female'));
        if (!femaleVoice && voices.length > 0) {
            femaleVoice = voices[0];
        }
        
        return femaleVoice;
    }
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    function setupSpeech(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower rate
        utterance.pitch = 1.03;
        utterance.volume = 1.0;
        
        const femaleVoice = loadVoices();
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }
        
        return utterance;
    }

    // Initialize presentation by positioning text and preparing for reading
    function initializePresentation() {
        // Reset all paragraphs
        paragraphs.forEach((paragraph, index) => {
            paragraph.dataset.index = index;
            paragraph.classList.remove('highlight');
        });
        
        // Hide the content initially
        paragraphContainer.style.opacity = '0';
        
        // Start the process
        setTimeout(() => {
            // Position all paragraphs in a single column
            paragraphContainer.style.position = 'absolute';
            paragraphContainer.style.top = contentBox.offsetHeight + 'px';
            paragraphContainer.style.opacity = '1';
            
            // Start with the first paragraph
            readNextParagraph(0);
        }, 500);
    }
    
    // Read each paragraph one by one, with smooth scrolling
    function readNextParagraph(index) {
        if (index >= paragraphs.length) {
            endPresentation();
            return;
        }
        
        // Stop any previous speech
        synth.cancel();
        
        // Remove highlight from previous paragraph
        if (activeIndex >= 0) {
            paragraphs[activeIndex].classList.remove('highlight');
        }
        
        // Set new active paragraph
        activeIndex = index;
        const currentParagraph = paragraphs[activeIndex];
        currentParagraph.classList.add('highlight');
        
        // Calculate position to center this paragraph in the viewport
        const paragraphRect = currentParagraph.getBoundingClientRect();
        const contentBoxRect = contentBox.getBoundingClientRect();
        const currentTop = paragraphContainer.offsetTop;
        
        // Calculate target position (center paragraph in viewport)
        const targetPosition = currentTop - (paragraphRect.top - contentBoxRect.top - contentBoxRect.height * 0.4);
        
        // Smooth scroll to this paragraph
        const startPosition = paragraphContainer.offsetTop;
        const distance = targetPosition - startPosition;
        const duration = 1000; // 1 second for scrolling
        let startTime;
        
        function animateScroll(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Calculate easing (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 2);
            
            // Apply the scroll position
            paragraphContainer.style.top = (startPosition + distance * easeProgress) + 'px';
            
            // Continue animation if not complete
            if (progress < 1) {
                window.requestAnimationFrame(animateScroll);
            } else {
                // Start reading after scrolling completes
                readParagraph(currentParagraph);
            }
        }
        
        window.requestAnimationFrame(animateScroll);
    }
    
    // Read the paragraph and wait until finished before moving to next
    function readParagraph(paragraph) {
        const utterance = setupSpeech(paragraph.textContent);
        
        // When finished reading this paragraph
        utterance.onend = function() {
            // Wait a moment before moving to next paragraph
            setTimeout(() => {
                readNextParagraph(activeIndex + 1);
            }, 500);
        };
        
        // Error handling
        utterance.onerror = function(event) {
            console.error('Speech synthesis error:', event);
            readNextParagraph(activeIndex + 1);
        };
        
        synth.speak(utterance);
    }
    
    // End the presentation
    function endPresentation() {
        // Stop any ongoing speech
        synth.cancel();
        
        // Fade out the paragraph container
        paragraphContainer.style.transition = 'opacity 1s ease';
        paragraphContainer.style.opacity = '0';
        
        // Show the thank you message
        setTimeout(() => {
            thankYou.classList.add('show-thank-you');
            
            // Speak the thank you message
            const thankYouText = "Thank you for your distinguished service to legal education.";
            const thankYouUtterance = setupSpeech(thankYouText);
            synth.speak(thankYouUtterance);
            
            // Add click event to restart the presentation
            container.addEventListener('click', resetPresentation);
        }, 1000);
    }
    
    // Reset and restart the presentation
    function resetPresentation() {
        // Stop any ongoing speech
        synth.cancel();
        
        // Hide thank you message
        thankYou.classList.remove('show-thank-you');
        
        // Reset paragraph styling
        paragraphs.forEach(paragraph => {
            paragraph.classList.remove('highlight');
        });
        
        // Reset states
        activeIndex = -1;
        
        // Reset container with no transition
        paragraphContainer.style.transition = 'none';
        paragraphContainer.style.top = '0';
        paragraphContainer.style.opacity = '0';
        
        // Wait for changes to take effect then restart
        setTimeout(() => {
            initializePresentation();
        }, 300);
        
        // Remove the click listener to prevent multiple resets
        container.removeEventListener('click', resetPresentation);
    }
    
    // Start the presentation
    initializePresentation();
});