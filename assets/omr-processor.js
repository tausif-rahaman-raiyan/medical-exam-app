// Function to open the camera modal
window.openHardOMRCamera = function() {
    document.getElementById('entry-modal').classList.add('hidden');
    document.getElementById('camera-modal').classList.remove('hidden');
};

// Function to handle the image upload and send to Python Backend
window.processHardOMR = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show Loading State
    const label = document.getElementById('omr-upload-label');
    const originalText = label.innerHTML;
    label.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> PROCESSING...';
    label.style.pointerEvents = 'none';

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Change this URL to your deployed backend URL (e.g., https://your-app.repl.co/upload)
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        
        // data format expected: { "predictions": [ "a", "b", "c", ... ] }
        if (data.predictions) {
            applyOMRAnswers(data.predictions);
        } else {
            alert("Could not detect answers. Please try a clearer photo.");
        }

    } catch (error) {
        console.error('Error:', error);
        alert("Server Error: Make sure your Python app.py is running.");
    } finally {
        label.innerHTML = originalText;
        label.style.pointerEvents = 'auto';
        document.getElementById('camera-modal').classList.add('hidden');
    }
};

// Function to inject answers into the existing exam engine
function applyOMRAnswers(predictions) {
    // predictions is an array like ['a', 'b', null, 'd']
    predictions.forEach((ans, index) => {
        if (ans !== null && ans !== "") {
            // This interacts with your existing 'userAnswers' variable in the HTML
            userAnswers[index] = ans.toLowerCase();
        }
    });

    // Automatically trigger the results
    alert("OMR Scanned Successfully!");
    submitExam(); 
}
