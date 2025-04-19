document.addEventListener('DOMContentLoaded', function() {
    // Get the elements
    const scrollText = document.getElementById('scrollText');
    const paragraphContainer = document.getElementById('paragraphContainer');
    const paragraphs = paragraphContainer.querySelectorAll('p');
    const thankYou = document.getElementById('thankYou');
    const container = document.querySelector('.container');
    const contentBox = document.querySelector('.content-box');
    const startButton = document.getElementById('startPresentation');
    
    // Audio setup - FIXED FILE NAME TO MATCH GITHUB REPOSITORY (lowercase v)
    const audioElement = new Audio('voice.mp3');
    audioElement.preload = 'auto'; // Preload audio
    let audioContext; // For Chrome audio unlock
    let audioLoaded = false;
    let activeIndex = -1;
    let animationFrame;
    
    // Approximate paragraph durations in seconds (adjust these to match your audio)
    const paragraphDurations = [
        20, // First paragraph duration - done
        28, // Second paragraph duration - done
        24, // Third paragraph duration - done
        14, // Fourth paragraph duration - done
        19, // Fifth paragraph duration - done
        14, // Sixth paragraph duration - 
        11  // Seventh paragraph duration
    ];
    
    // Total duration for thank you message
    const thankYouDuration = 5; // seconds
    
    // Flag to track if presentation is running
    let presentationRunning = false;
    
    // Browser detection
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Log audio file info
    console.log('Audio file path:', audioElement.src);
    
    // Function to initialize AudioContext (needed for Chrome)
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
    }
    
    // Function to load audio
    function loadAudio() {
        return new Promise((resolve, reject) => {
            if (audioLoaded) {
                resolve();
                return;
            }
            
            console.log('Attempting to load audio file...');
            
            // Make sure audio file is loaded
            audioElement.addEventListener('canplaythrough', function onCanPlay() {
                console.log('Audio loaded successfully!');
                audioLoaded = true;
                audioElement.removeEventListener('canplaythrough', onCanPlay);
                resolve();
            });
            
            audioElement.addEventListener('error', function(e) {
                console.error('Audio error:', e);
                console.error('Audio error code:', audioElement.error.code);
                console.error('Audio error message:', audioElement.error.message);
                console.error('Audio src:', audioElement.src);
                reject(new Error('Failed to load audio'));
            });
            
            // Force reload the audio
            audioElement.load();
        });
    }
    
    // Initialize presentation by positioning text and preparing for reading
    function initializePresentation() {
        // Reset all paragraphs
        paragraphs.forEach((paragraph, index) => {
            paragraph.dataset.index = index;
            paragraph.classList.remove('highlight');
            paragraph.style.transform = 'none';
        });
        
        // Hide the content initially
        paragraphContainer.style.opacity = '0';
        
        // Start the process
        setTimeout(() => {
            // Position all paragraphs in a single column
            paragraphContainer.style.position = 'absolute';
            paragraphContainer.style.top = contentBox.offsetHeight + 'px';
            paragraphContainer.style.opacity = '1';
            
            // Start audio and first paragraph
            playAudioWithUnlock()
                .then(() => readNextParagraph(0))
                .catch(err => {
                    console.error('Error starting presentation:', err);
                    // If audio fails, continue anyway without audio
                    readNextParagraph(0);
                });
        }, 500);
    }
    
    // Function to play audio with unlock for Chrome
    function playAudioWithUnlock() {
        return new Promise((resolve, reject) => {
            // For Chrome's autoplay policy
            if (isChrome || isSafari) {
                initAudioContext();
            }
            
            // Reset audio position
            audioElement.currentTime = 0;
            
            console.log('Attempting to play audio...');
            
            // Play audio with error handling
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Audio started successfully
                        console.log('Audio playing successfully!');
                        resolve();
                    })
                    .catch(err => {
                        console.warn('Autoplay prevented or audio error:', err);
                        // Continue without audio
                        resolve();
                    });
            } else {
                // Old browsers don't return a promise
                resolve();
            }
        });
    }
    
    // Gentle floating animation for the active paragraph
    function animateParagraph(paragraph) {
        let startTime = null;
        const duration = 3000; // 3 seconds per cycle
        const maxOffset = 3; // Maximum pixel movement
        
        // Cancel any existing animation
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            
            // Calculate sine wave position (0 to 1 to 0)
            const progress = (elapsed % duration) / duration;
            const offset = Math.sin(progress * Math.PI * 2) * maxOffset;
            
            // Apply the floating effect
            paragraph.style.transform = `translateY(${offset}px)`;
            
            // Continue animation
            animationFrame = requestAnimationFrame(animate);
        }
        
        // Start the animation
        animationFrame = requestAnimationFrame(animate);
        
        // Return function to stop animation
        return function stopAnimation() {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                paragraph.style.transform = 'none';
            }
        };
    }
    
    // Read each paragraph one by one, with smooth scrolling
    function readNextParagraph(index) {
        if (index >= paragraphs.length) {
            endPresentation();
            return;
        }
        
        // Remove highlight from previous paragraph and reset its position
        if (activeIndex >= 0) {
            paragraphs[activeIndex].classList.remove('highlight');
            paragraphs[activeIndex].style.transform = 'none';
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
            
            // Apply the scroll position with small vertical motion
            const newPos = startPosition + distance * easeProgress;
            paragraphContainer.style.top = newPos + 'px';
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                // Start the floating animation
                const stopFloating = animateParagraph(currentParagraph);
                
                // Wait for paragraph duration then move to next
                setTimeout(() => {
                    // Stop the floating animation
                    if (stopFloating) stopFloating();
                    
                    // Wait a moment before moving to next paragraph
                    setTimeout(() => {
                        readNextParagraph(activeIndex + 1);
                    }, 500);
                }, paragraphDurations[index] * 1000);
            }
        }
        
        requestAnimationFrame(animateScroll);
    }
    
    // End the presentation
    function endPresentation() {
        // Cancel any animation
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        // Fade out the paragraph container
        paragraphContainer.style.transition = 'opacity 1s ease';
        paragraphContainer.style.opacity = '0';
        
        // Show the thank you message
        setTimeout(() => {
            thankYou.classList.add('show-thank-you');
            
            // Show start button again after thank you duration
            setTimeout(() => {
                audioElement.pause();
                presentationRunning = false;
                
                // Show the start button again
                startButton.classList.remove('hidden');
                
                // Add click event to restart the presentation
                container.addEventListener('click', resetPresentation);
            }, thankYouDuration * 1000);
        }, 1000);
    }
    
    // Reset and restart the presentation
    function resetPresentation() {
        // If already running, don't start again
        if (presentationRunning) return;
        
        // Reset audio
        audioElement.pause();
        audioElement.currentTime = 0;
        
        // Cancel any animation
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        // Hide thank you message
        thankYou.classList.remove('show-thank-you');
        
        // Reset paragraph styling
        paragraphs.forEach(paragraph => {
            paragraph.classList.remove('highlight');
            paragraph.style.transform = 'none';
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
    
    // Start presentation on button click (needed for audio in Chrome)
    startButton.addEventListener('click', function() {
        if (presentationRunning) return;
        
        presentationRunning = true;
        startButton.classList.add('hidden');
        
        // Make sure all content is visible
        document.querySelector('.left-panel').style.overflow = 'visible';
        
        // Preload the audio
        loadAudio()
            .then(() => {
                // Start the presentation
                initializePresentation();
            })
            .catch(err => {
                console.error('Failed to load audio:', err);
                // Start without audio
                initializePresentation();
            });
    });
    
    // Handle audio errors
    audioElement.onerror = function(event) {
        console.error('Audio playback error:', event);
        console.error('Audio error details:', audioElement.error);
    };
    
    // Don't auto-start, wait for button click
});