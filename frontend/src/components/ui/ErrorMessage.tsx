<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Message Pop-up</title>
    <style>
        /* Reset & Layout Blueprint */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: #f4f5f7;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        /* The Error Card Container */
        .error-popup {
            background-color: #ffffff;
            border-left: 5px solid #e53e3e; /* Crimson red accent line */
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: flex-start;
            padding: 20px;
            width: 400px;
            max-width: 90%;
            position: relative;
            
            /* Animations: Slide/fade in first, then shake briefly */
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                      shake 0.4s ease-in-out 0.4s 1;
        }

        /* Red Warning Icon Wrapper */
        .error-icon {
            background-color: #fed7d7;
            border-radius: 50%;
            color: #c53030;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.2rem;
            font-weight: bold;
            height: 36px;
            width: 36px;
            margin-right: 16px;
            flex-shrink: 0;
        }

        /* Text Content Layout */
        .error-content {
            flex-grow: 1;
            padding-right: 20px;
        }

        .error-title {
            color: #2d3748;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .error-message {
            color: #718096;
            font-size: 0.875rem;
            line-height: 1.4;
        }

        /* Close Button styling */
        .close-btn {
            background: none;
            border: none;
            color: #a0aec0;
            cursor: pointer;
            font-size: 1.25rem;
            line-height: 1;
            position: absolute;
            top: 16px;
            right: 16px;
            transition: color 0.2s ease;
        }

        .close-btn:hover {
            color: #4a5568;
        }

        /* --- ANIMATION TIMELINES --- */

        /* Smooth slide up and fade in */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Subtle horizontal shake to signal an impediment */
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
        }
    </style>
</head>
<body>

    <div class="error-popup">
        <div class="error-icon">!</div>
        <div class="error-content">
            <h3 class="error-title">Connection Failed</h3>
            <p class="error-message">We couldn't save your changes because the server timed out. Please check your internet connection and try again.</p>
        </div>
        <button class="close-btn" onclick="this.parentElement.style.display='none'">&times;</button>
    </div>

</body>
</html>