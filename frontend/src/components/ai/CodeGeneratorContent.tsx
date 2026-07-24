"use client";

import dynamic from "next/dynamic";

const CodeBlock = dynamic(() => import("./Codeblock"), {
  ssr: false,
});

export default function CodeGeneratorContent() {
  const reactComponentCode = ` <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Form</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .login-container {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h1 {
      color: #333;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .login-header p {
      color: #666;
      font-size: 0.9rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e1e5e9;
      border-radius: 5px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .login-btn {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease;
      margin-bottom: 1rem;
    }

    .login-btn:hover {
      transform: translateY(-2px);
    }

    .divider {
      text-align: center;
      margin: 1.5rem 0;
      position: relative;
      color: #666;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e1e5e9;
      z-index: 1;
    }

    .divider span {
      background: white;
      padding: 0 1rem;
      position: relative;
      z-index: 2;
    }

    .social-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .social-btn {
      padding: 0.75rem;
      border: 2px solid #e1e5e9;
      border-radius: 5px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      text-decoration: none;
      color: #333;
      font-weight: 500;
    }

    .social-btn:hover {
      border-color: #667eea;
      transform: translateY(-2px);
    }

    .google-btn:hover {
      background: #db4437;
      color: white;
      border-color: #db4437;
    }

    .github-btn:hover {
      background: #333;
      color: white;
      border-color: #333;
    }

    .forgot-password {
      text-align: center;
      margin-top: 1rem;
    }

    .forgot-password a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .forgot-password a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <h1>Welcome Back</h1>
      <p>Please sign in to your account</p>
    </div>
    
    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required>
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
      </div>
      
      <button type="submit" class="login-btn">Sign In</button>
    </form>
</body>
</html> `;

  return (
    <div className="no-scrollbar relative z-20 max-h-[50vh] space-y-7 overflow-y-auto pb-7">
      {/* User Message 1 */}
      <div className="flex justify-end">
        <div className="shadow-theme-xs bg-brand-100 dark:bg-brand-500/20 max-w-[480px] rounded-xl rounded-tr-xs px-4 py-3">
          <p className="text-left text-sm font-normal text-gray-800 dark:text-white/90">
            Give me a React login form component with Google & GitHub
            authentication
          </p>
        </div>
      </div>

      {/* AI Response 1 - React Component */}
      <div className="flex lg:justify-start mb-6">
        <div className="w-full flex-1">
          <CodeBlock
            code={reactComponentCode}
            language="html"
            showLineNumbers
          />

          <div className="mt-4">
            <p className="text-sm leading-5 text-gray-500 dark:text-gray-400">
              Here is the code for login form with google and github
              authentication as described.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
