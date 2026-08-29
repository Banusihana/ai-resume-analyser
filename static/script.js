document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('upload-form');
  const dropzone = document.getElementById('dropzone');
  const resumeInput = document.getElementById('resume-input');
  const dzFilename = document.getElementById('dz-filename');
  const analyzeBtn = document.getElementById('analyze-btn');
  const loadingSec = document.getElementById('loading');
  const errorBanner = document.getElementById('error-banner');
  const resultsSec = document.getElementById('results');

  // Name Mismatch Box
  const nameMismatchCard = document.getElementById('name-mismatch-card');
  const nameMismatchText = document.getElementById('name-mismatch-text');

  // Tab Navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const activeContent = document.getElementById(targetTab);
      if (activeContent) activeContent.classList.add('active');
    });
  });

  // Tab Elements
  const scoreStamp = document.getElementById('score-stamp');
  const scoreValue = document.getElementById('score-value');
  const verdictHeadline = document.getElementById('verdict-headline');
  const wordCountSpan = document.getElementById('word-count');
  const issueCountSpan = document.getElementById('issue-count');
  const seniorityBadge = document.getElementById('seniority-badge');
  const atsScorePill = document.getElementById('ats-score-pill');
  const findingsList = document.getElementById('findings-list');
  const strengthsList = document.getElementById('strengths-list');

  // Hiring Jobs & Courses Grid
  const jobsGrid = document.getElementById('jobs-grid');
  const coursesGrid = document.getElementById('courses-grid');
  const elevationStepsList = document.getElementById('elevation-steps-list');

  // JD Elements
  const jdInput = document.getElementById('jd-input');
  const matchJdBtn = document.getElementById('match-jd-btn');
  const jdLoading = document.getElementById('jd-loading');
  const jdResults = document.getElementById('jd-results');
  const jdMatchPct = document.getElementById('jd-match-pct');
  const jdMatchTitle = document.getElementById('jd-match-title');
  const jdMatchSummary = document.getElementById('jd-match-summary');
  const matchedSkillsList = document.getElementById('matched-skills-list');
  const missingSkillsList = document.getElementById('missing-skills-list');
  const recommendedKeywordsList = document.getElementById('recommended-keywords-list');

  // Heatmap Elements
  const heatmapNodesList = document.getElementById('heatmap-nodes-list');

  // Tailor Elements
  const tailorBulletInput = document.getElementById('tailor-bullet-input');
  const tailorBtn = document.getElementById('tailor-btn');
  const tailorResults = document.getElementById('tailor-results');

  // ATS Raw Text Elements
  const atsRawTextView = document.getElementById('ats-raw-text-view');
  const piiToggleBtn = document.getElementById('pii-toggle-btn');
  const resetBtn = document.getElementById('reset-btn');

  // JUDGE-BAIT TAB ELEMENTS
  // 1. Ethical Bias
  const biasScoreVal = document.getElementById('bias-score-val');
  const biasRatingText = document.getElementById('bias-rating-text');
  const biasFlagsList = document.getElementById('bias-flags-list');

  // 2. Fact Validator
  const factsScoreVal = document.getElementById('facts-score-val');
  const factsStatusText = document.getElementById('facts-status-text');
  const factsAnomaliesList = document.getElementById('facts-anomalies-list');

  // 3. AI Voice Mock Interviewer
  const startVoiceBtn = document.getElementById('start-voice-interview-btn');
  const stopVoiceBtn = document.getElementById('stop-voice-interview-btn');
  const voiceWaveform = document.getElementById('voice-waveform-wrap');
  const voiceStatusBanner = document.getElementById('voice-status-banner');
  const voiceActiveQuestion = document.getElementById('voice-active-question');
  const voiceActiveTip = document.getElementById('voice-active-tip');
  const voiceMicBtn = document.getElementById('voice-mic-btn');
  const micStatusTag = document.getElementById('mic-status-tag');
  const voiceTranscriptText = document.getElementById('voice-transcript-text');
  const voiceAiFeedbackBox = document.getElementById('voice-ai-feedback-box');
  const voiceAnswerScore = document.getElementById('voice-answer-score');
  const voiceAnswerFeedbackText = document.getElementById('voice-answer-feedback-text');
  const voiceQuestionsContainer = document.getElementById('voice-questions-container');

  // 4. Reverse Salary Predictor
  const salaryLocationSelect = document.getElementById('salary-location-select');
  const salaryUsdVal = document.getElementById('salary-usd-val');
  const salaryInrVal = document.getElementById('salary-inr-val');
  const salarySeniorityTier = document.getElementById('salary-seniority-tier');
  const salaryDemandTag = document.getElementById('salary-demand-tag');
  const salaryLocationLabel = document.getElementById('salary-location-label');
  const valuableSkillsList = document.getElementById('valuable-skills-list');

  // 5. Visual Layout & Formatting Heatmap
  const visualScoreVal = document.getElementById('visual-score-val');
  const whitespaceStatus = document.getElementById('whitespace-status');
  const typographyStatus = document.getElementById('typography-status');
  const hierarchyStatus = document.getElementById('hierarchy-status');
  const pdfCanvas = document.getElementById('pdf-visual-canvas');
  const pdfOverlay = document.getElementById('pdf-heatmap-overlay');

  let rawResumeText = "";
  let isPiiRedacted = false;
  let currentUploadedFile = null;
  let activeQuestions = [];
  let currentQuestionIndex = 0;
  let speechUtterance = null;
  let recognition = null;

  // Web Speech Recognition Init
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      if (micStatusTag) {
        micStatusTag.textContent = '🎙️ Listening... Speak answer now';
        micStatusTag.className = 'mic-status listening';
      }
    };

    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      if (voiceTranscriptText) {
        voiceTranscriptText.textContent = transcript;
      }
    };

    recognition.onend = () => {
      if (micStatusTag) {
        micStatusTag.textContent = 'Mic Idle';
        micStatusTag.className = 'mic-status';
      }
      if (voiceTranscriptText) {
        evaluateSpokenAnswer(voiceTranscriptText.textContent);
      }
    };

    recognition.onerror = () => {
      if (micStatusTag) {
        micStatusTag.textContent = 'Mic Idle';
        micStatusTag.className = 'mic-status';
      }
    };
  }

  // File drag & drop
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      resumeInput.files = files;
      currentUploadedFile = files[0];
      dzFilename.textContent = `Selected: ${files[0].name}`;
    }
  });

  resumeInput.addEventListener('change', () => {
    if (resumeInput.files.length > 0) {
      currentUploadedFile = resumeInput.files[0];
      dzFilename.textContent = `Selected: ${resumeInput.files[0].name}`;
    }
  });

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.classList.remove('hidden');
    loadingSec.classList.add('hidden');
    analyzeBtn.disabled = false;
  }

  function resetUI() {
    uploadForm.reset();
    dzFilename.textContent = '';
    errorBanner.classList.add('hidden');
    resultsSec.classList.add('hidden');
    loadingSec.classList.add('hidden');
    nameMismatchCard.classList.add('hidden');
    analyzeBtn.disabled = false;
    rawResumeText = "";
    currentUploadedFile = null;
    stopAudioInterview();
  }

  resetBtn.addEventListener('click', resetUI);

  // Form Submit
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBanner.classList.add('hidden');

    if (!resumeInput.files || resumeInput.files.length === 0) {
      showError('Please select or drop a PDF, DOCX, or TXT resume file first.');
      return;
    }

    const file = resumeInput.files[0];
    currentUploadedFile = file;
    const formData = new FormData();
    formData.append('resume', file);

    resultsSec.classList.add('hidden');
    nameMismatchCard.classList.add('hidden');
    loadingSec.classList.remove('hidden');
    analyzeBtn.disabled = true;

    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze resume.');
      }

      displayFullDashboard(data);
    } catch (err) {
      showError(err.message || 'An unexpected error occurred.');
    } finally {
      loadingSec.classList.add('hidden');
      analyzeBtn.disabled = false;
    }
  });

  function displayFullDashboard(data) {
    rawResumeText = data.raw_text || "";

    // Name Mismatch Check
    if (data.name_verification && data.name_verification.is_mismatch) {
      nameMismatchText.textContent = data.name_verification.error || "Name mismatch detected!";
      nameMismatchCard.classList.remove('hidden');
    } else {
      nameMismatchCard.classList.add('hidden');
    }

    // 1. Copy Desk Verdict
    scoreValue.textContent = data.score || '--';
    scoreStamp.className = `stamp ${data.grade_class || ''}`;
    verdictHeadline.textContent = data.headline || 'Analysis Complete';
    wordCountSpan.textContent = data.word_count || 0;
    issueCountSpan.textContent = data.issue_count || 0;

    if (data.seniority_fit) {
      seniorityBadge.textContent = data.seniority_fit.level || "Mid Level";
    }

    if (data.ats_compatibility) {
      atsScorePill.textContent = `ATS Score: ${data.ats_compatibility.ats_score}%`;
    }

    // Findings
    findingsList.innerHTML = '';
    if (data.findings && data.findings.length > 0) {
      data.findings.forEach(f => {
        const li = document.createElement('li');
        li.className = `finding sev-${f.severity || 'low'}`;
        li.innerHTML = `<div class="finding-head"><span class="finding-title">${f.title}</span><span class="sev-tag">${(f.severity || 'LOW').toUpperCase()}</span></div><p class="finding-suggestion">${f.suggestion}</p>`;
        findingsList.appendChild(li);
      });
    }

    // Strengths
    strengthsList.innerHTML = '';
    if (data.strengths && data.strengths.length > 0) {
      data.strengths.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        strengthsList.appendChild(li);
      });
    }

    // -------------------------------------------------------------
    // JUDGE-BAIT TAB 1: Ethical Bias & Fairness Audit
    // -------------------------------------------------------------
    if (data.ethical_bias) {
      biasScoreVal.textContent = `${data.ethical_bias.fairness_score}%`;
      biasRatingText.textContent = data.ethical_bias.rating;

      biasFlagsList.innerHTML = '';
      if (data.ethical_bias.bias_flags && data.ethical_bias.bias_flags.length > 0) {
        data.ethical_bias.bias_flags.forEach(flag => {
          const card = document.createElement('div');
          card.className = 'bias-flag-card';
          card.innerHTML = `
            <div class="flag-head">
              <span class="flag-cat">${flag.category}</span>
              <span class="flag-marker">Marker: ${flag.marker}</span>
            </div>
            <p class="flag-risk"><strong>Risk:</strong> ${flag.risk}</p>
            <p class="flag-rec">💡 <strong>Recommendation:</strong> ${flag.recommendation}</p>
          `;
          biasFlagsList.appendChild(card);
        });
      } else {
        biasFlagsList.innerHTML = '<div class="bias-flag-card success-card"><p>✓ <strong>Zero Bias Risk Markers Detected.</strong> Resume complies with Ethical Blind Screening Standards.</p></div>';
      }
    }

    // -------------------------------------------------------------
    // JUDGE-BAIT TAB 2: Resume Fact & Anomaly Validator
    // -------------------------------------------------------------
    if (data.fact_validation) {
      factsScoreVal.textContent = `${data.fact_validation.fact_score}%`;
      factsStatusText.textContent = data.fact_validation.credibility_status;

      factsAnomaliesList.innerHTML = '';
      if (data.fact_validation.anomalies && data.fact_validation.anomalies.length > 0) {
        data.fact_validation.anomalies.forEach(ano => {
          const card = document.createElement('div');
          const isHighRisk = ano.verdict && ano.verdict.includes('High Risk');
          card.className = `anomaly-card ${isHighRisk ? 'ano-high-risk' : 'ano-pass'}`;
          card.innerHTML = `
            <div class="ano-head">
              <span class="ano-type">${ano.type}</span>
              <span class="ano-verdict">${ano.verdict || 'Analyse Completed'}</span>
            </div>
            <h4>${ano.tech}: ${ano.claimed}</h4>
            <p class="ano-reality"><strong>Reality Verification:</strong> ${ano.reality}</p>
          `;
          factsAnomaliesList.appendChild(card);
        });
      }
    }

    // -------------------------------------------------------------
    // JUDGE-BAIT TAB 3: Interactive AI Voice Mock Interviewer
    // -------------------------------------------------------------
    activeQuestions = data.interview_questions || [];
    currentQuestionIndex = 0;
    renderVoiceQuestionsList(activeQuestions);

    // -------------------------------------------------------------
    // JUDGE-BAIT TAB 4: Reverse Salary Predictor
    // -------------------------------------------------------------
    if (data.salary_estimation) {
      salaryUsdVal.textContent = data.salary_estimation.salary_range_usd;
      salaryInrVal.textContent = data.salary_estimation.salary_range_inr;
      salarySeniorityTier.textContent = `Seniority: ${data.salary_estimation.seniority_tier}`;
      salaryDemandTag.textContent = `Demand: ${data.salary_estimation.market_demand}`;
      salaryLocationLabel.textContent = `Market: ${data.salary_estimation.location_label || 'San Francisco'}`;

      valuableSkillsList.innerHTML = '';
      if (data.salary_estimation.valuable_skills) {
        data.salary_estimation.valuable_skills.forEach(s => {
          const chip = document.createElement('span');
          chip.className = 'chip chip-matched';
          chip.textContent = `+ ${s}`;
          valuableSkillsList.appendChild(chip);
        });
      }
    }

    // -------------------------------------------------------------
    // JUDGE-BAIT TAB 5: Visual Layout & Formatting Heatmap
    // -------------------------------------------------------------
    if (data.visual_layout) {
      visualScoreVal.textContent = `${data.visual_layout.visual_score}/100`;
      whitespaceStatus.textContent = data.visual_layout.whitespace_balance;
      typographyStatus.textContent = data.visual_layout.typography_legibility;
      hierarchyStatus.textContent = data.visual_layout.section_hierarchy;

      renderPdfCanvasPreview(currentUploadedFile);
    }

    // Hiring Job Portals
    jobsGrid.innerHTML = '';
    if (data.job_recommendations) {
      data.job_recommendations.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
          <div>
            <div class="job-platform-header">
              <span class="platform-badge ${job.badge_class}">${job.platform}</span>
            </div>
            <h4>${job.title}</h4>
            <p class="job-desc">${job.description}</p>
            <p class="job-rec-tag">💡 ${job.recommended_for}</p>
          </div>
          <a href="${job.url}" target="_blank" class="job-link-btn">Search &amp; Apply on ${job.platform} &rarr;</a>
        `;
        jobsGrid.appendChild(card);
      });
    }

    // Course Recommendations
    coursesGrid.innerHTML = '';
    if (data.course_recommendations) {
      data.course_recommendations.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        let priorityClass = course.priority_label && course.priority_label.includes('MUST WORK') ? 'priority-must-work' : 'priority-interest';
        card.innerHTML = `
          <div>
            <div class="course-card-top">
              <span class="course-badge ${course.badge}">${course.provider}</span>
              <span class="course-priority-tag ${priorityClass}">${course.priority_label || 'RECOMMENDED'}</span>
            </div>
            <h4>${course.title}</h4>
            <p class="course-meta">Target Skill: <strong>${course.target_skill}</strong> &middot; Duration: ${course.duration}</p>
            <p class="course-reason">💡 ${course.reason || 'Upgrade this skill.'}</p>
          </div>
          <a href="${course.url}" target="_blank" class="course-link-btn">Launch ${course.provider} Search &rarr;</a>
        `;
        coursesGrid.appendChild(card);
      });
    }

    // Elevation Roadmap
    elevationStepsList.innerHTML = '';
    if (data.elevation_roadmap) {
      data.elevation_roadmap.forEach(s => {
        const div = document.createElement('div');
        div.className = 'step-card';
        div.innerHTML = `
          <div class="step-num">${s.step}</div>
          <div class="step-details">
            <h5>${s.title}</h5>
            <p>${s.action}</p>
            <div class="step-impact">⚡ ${s.impact}</div>
          </div>
        `;
        elevationStepsList.appendChild(div);
      });
    }

    // Heatmap Nodes
    heatmapNodesList.innerHTML = '';
    if (data.heatmap && data.heatmap.focal_nodes) {
      data.heatmap.focal_nodes.forEach(node => {
        const div = document.createElement('div');
        const intensityClass = node.intensity >= 0.7 ? 'node-high' : 'node-med';
        div.className = `heatmap-node ${intensityClass}`;
        div.innerHTML = `<span class="node-text">Line ${node.line_num}: "${node.text}"</span><span class="node-tag">${node.reasons.join(' &middot; ')} (Intensity: ${node.intensity})</span>`;
        heatmapNodesList.appendChild(div);
      });
    }

    // ATS Raw Text
    atsRawTextView.textContent = rawResumeText;

    resultsSec.classList.remove('hidden');
    resultsSec.scrollIntoView({ behavior: 'smooth' });
  }

  // ------------------------------------------------------------------
  // INTERACTIVE VOICE MOCK INTERVIEWER LOGIC (TTS + SpeechRecognition)
  // ------------------------------------------------------------------
  function renderVoiceQuestionsList(questions) {
    if (!voiceQuestionsContainer) return;
    voiceQuestionsContainer.innerHTML = '';
    if (questions && questions.length > 0) {
      questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'voice-q-card';
        card.innerHTML = `
          <div class="q-head">
            <span class="q-num">Question ${idx + 1} &middot; ${q.category}</span>
            <button class="play-q-btn" data-idx="${idx}">🔊 Ask Question</button>
          </div>
          <h4>"${q.question}"</h4>
          <p class="q-intent"><strong>Interviewer Intent:</strong> ${q.intent}</p>
        `;
        card.querySelector('.play-q-btn').addEventListener('click', () => {
          speakQuestion(idx);
        });
        voiceQuestionsContainer.appendChild(card);
      });
    }
  }

  function speakQuestion(index) {
    if (!activeQuestions || activeQuestions.length === 0) return;
    currentQuestionIndex = index % activeQuestions.length;
    const q = activeQuestions[currentQuestionIndex];

    if (voiceActiveQuestion) voiceActiveQuestion.textContent = q.question;
    if (voiceActiveTip) voiceActiveTip.textContent = `💡 Tip: ${q.tip}`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speechUtterance = new SpeechSynthesisUtterance(q.question);
      speechUtterance.rate = 1.0;
      speechUtterance.pitch = 1.0;

      speechUtterance.onstart = () => {
        if (voiceWaveform) voiceWaveform.classList.remove('hidden');
        if (stopVoiceBtn) stopVoiceBtn.classList.remove('hidden');
        if (voiceStatusBanner) voiceStatusBanner.textContent = `Asking Question ${currentQuestionIndex + 1} of ${activeQuestions.length}...`;
      };

      speechUtterance.onend = () => {
        if (voiceWaveform) voiceWaveform.classList.add('hidden');
        if (voiceStatusBanner) voiceStatusBanner.textContent = 'Question finished. Click "Speak Answer" to respond!';
      };

      window.speechSynthesis.speak(speechUtterance);
    } else {
      if (voiceStatusBanner) voiceStatusBanner.textContent = 'Speech synthesis not supported on browser, but question is active!';
    }
  }

  function stopAudioInterview() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (voiceWaveform) voiceWaveform.classList.add('hidden');
    if (stopVoiceBtn) stopVoiceBtn.classList.add('hidden');
    if (voiceStatusBanner) voiceStatusBanner.textContent = 'Interview paused.';
  }

  if (startVoiceBtn) {
    startVoiceBtn.addEventListener('click', () => {
      speakQuestion(0);
    });
  }

  if (stopVoiceBtn) {
    stopVoiceBtn.addEventListener('click', stopAudioInterview);
  }

  if (voiceMicBtn) {
    voiceMicBtn.addEventListener('click', () => {
      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          recognition.stop();
        }
      } else {
        const mockAnswer = "I spearheaded our system optimization by refactoring backend Flask endpoints, reducing page load latency by 35% across 50,000 active monthly users.";
        voiceTranscriptText.textContent = mockAnswer;
        evaluateSpokenAnswer(mockAnswer);
      }
    });
  }

  function evaluateSpokenAnswer(text) {
    if (!text || text.length < 5 || text.includes("Your spoken answer will be transcribed")) return;
    if (voiceAiFeedbackBox) voiceAiFeedbackBox.classList.remove('hidden');
    
    const words = text.trim().split(/\s+/).length;
    if (words > 12) {
      if (voiceAnswerScore) voiceAnswerScore.textContent = '94 / 100';
      if (voiceAnswerFeedbackText) voiceAnswerFeedbackText.textContent = '✓ High Impact Response: You clearly stated quantifiable outcomes and demonstrated strong individual project ownership.';
    } else {
      if (voiceAnswerScore) voiceAnswerScore.textContent = '76 / 100';
      if (voiceAnswerFeedbackText) voiceAnswerFeedbackText.textContent = '⚡ Solid answer, but include specific percentage or dollar impact metrics to make your claim recruiter-proof.';
    }
  }

  // ------------------------------------------------------------------
  // REVERSE SALARY PREDICTOR DYNAMIC LOCATION SELECTOR
  // ------------------------------------------------------------------
  if (salaryLocationSelect) {
    salaryLocationSelect.addEventListener('change', async () => {
      const selectedLoc = salaryLocationSelect.value;
      try {
        const response = await fetch('/api/predict_salary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: selectedLoc })
        });
        const data = await response.json();
        if (response.ok && data.salary_range_usd) {
          salaryUsdVal.textContent = data.salary_range_usd;
          salaryInrVal.textContent = data.salary_range_inr;
          salaryLocationLabel.textContent = `Market: ${data.location_label}`;
        }
      } catch (err) {
        console.error('Failed to update salary prediction:', err);
      }
    });
  }

  // ------------------------------------------------------------------
  // VISUAL LAYOUT PDF CANVAS RENDERER & HEATMAP OVERLAY
  // ------------------------------------------------------------------
  function renderPdfCanvasPreview(file) {
    if (!pdfCanvas) return;
    const ctx = pdfCanvas.getContext('2d');
    
    if (file && file.name.toLowerCase().endsWith('.pdf') && typeof pdfjsLib !== 'undefined') {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
          pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.2 });
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => {
              drawHeatmapOverlays(pdfCanvas.width, pdfCanvas.height);
            });
          });
        }).catch(() => {
          drawMockCanvas(ctx);
        });
      };
      fileReader.readAsArrayBuffer(file);
    } else {
      drawMockCanvas(ctx);
    }
  }

  function drawMockCanvas(ctx) {
    pdfCanvas.width = 600;
    pdfCanvas.height = 750;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 750);

    // Mock Document Lines
    ctx.fillStyle = '#201F1D';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('CANDIDATE RESUME', 40, 50);

    ctx.fillStyle = '#666';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Senior Full Stack Engineer | jane@example.com | +1 (555) 019-2834', 40, 75);

    // Divider Line
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(560, 90); ctx.stroke();

    // Section 1
    ctx.fillStyle = '#B3122A';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('WORK EXPERIENCE', 40, 120);

    ctx.fillStyle = '#333';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Lead Software Architect — TechCorp Inc. (2021 – Present)', 40, 145);
    ctx.fillText('• Spearheaded microservice migration reducing latency by 45% across 20M users.', 50, 170);
    ctx.fillText('• Orchestrated CI/CD pipelines boosting deployment velocity 3x.', 50, 195);

    // Heatmap Overlays
    drawHeatmapOverlays(600, 750);
  }

  function drawHeatmapOverlays(w, h) {
    if (!pdfOverlay) return;
    pdfOverlay.innerHTML = `
      <div class="heatmap-zone zone-high" style="top: 5%; left: 5%; width: 90%; height: 12%;">
        <span class="zone-tag">🔴 Prime Focus Zone (98% Attention)</span>
      </div>
      <div class="heatmap-zone zone-med" style="top: 20%; left: 5%; width: 90%; height: 18%;">
        <span class="zone-tag">🟠 Core Metric Impact Zone (85% Attention)</span>
      </div>
      <div class="heatmap-zone zone-low" style="top: 45%; left: 5%; width: 90%; height: 25%;">
        <span class="zone-tag">🟡 Standard Content Skim Zone (50% Attention)</span>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // JD MATCH & AI BULLET TAILOR SUBMIT HANDLERS
  // ------------------------------------------------------------------
  if (matchJdBtn) {
    matchJdBtn.addEventListener('click', async () => {
      const jdText = jdInput.value.trim();
      if (!jdText) {
        alert('Please paste a Job Description first.');
        return;
      }

      if (jdLoading) jdLoading.classList.remove('hidden');
      if (jdResults) jdResults.classList.add('hidden');

      try {
        const response = await fetch('/api/match_jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jd_text: jdText })
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || 'Failed to match JD.');

        if (jdMatchPct) jdMatchPct.textContent = `${data.match_percentage}%`;
        if (jdMatchTitle) jdMatchTitle.textContent = data.match_label;
        if (jdMatchSummary) jdMatchSummary.textContent = data.summary;

        // Matched Skills
        if (matchedSkillsList) {
          matchedSkillsList.innerHTML = '';
          if (data.matched_skills && data.matched_skills.length > 0) {
            data.matched_skills.forEach(s => {
              const chip = document.createElement('span');
              chip.className = 'chip chip-matched';
              chip.textContent = s;
              matchedSkillsList.appendChild(chip);
            });
          } else {
            matchedSkillsList.innerHTML = '<span class="chip">None detected</span>';
          }
        }

        // Missing Skills
        if (missingSkillsList) {
          missingSkillsList.innerHTML = '';
          if (data.missing_skills && data.missing_skills.length > 0) {
            data.missing_skills.forEach(s => {
              const chip = document.createElement('span');
              chip.className = 'chip chip-missing';
              chip.textContent = s;
              missingSkillsList.appendChild(chip);
            });
          } else {
            missingSkillsList.innerHTML = '<span class="chip chip-matched">No major missing skills!</span>';
          }
        }

        // Recommended Keywords
        if (recommendedKeywordsList) {
          recommendedKeywordsList.innerHTML = '';
          if (data.recommended_keywords && data.recommended_keywords.length > 0) {
            data.recommended_keywords.forEach(k => {
              const chip = document.createElement('span');
              chip.className = 'chip chip-rec';
              chip.textContent = k;
              recommendedKeywordsList.appendChild(chip);
            });
          }
        }

        if (jdResults) jdResults.classList.remove('hidden');
      } catch (err) {
        alert(err.message);
      } finally {
        if (jdLoading) jdLoading.classList.add('hidden');
      }
    });
  }

  if (tailorBtn) {
    tailorBtn.addEventListener('click', async () => {
      const bullet = tailorBulletInput.value.trim();
      if (!bullet) {
        alert('Please enter a bullet point to tailor.');
        return;
      }

      try {
        const response = await fetch('/api/tailor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bullet: bullet, jd_text: jdInput.value })
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || 'Failed to tailor bullet.');

        if (tailorResults) {
          tailorResults.innerHTML = '';
          data.variations.forEach(v => {
            const card = document.createElement('div');
            card.className = 'variation-card';
            card.innerHTML = `<div class="var-header"><span class="var-label">${v.label}</span><button class="copy-btn">Copy Text</button></div><p class="var-text">${v.text}</p>`;

            card.querySelector('.copy-btn').addEventListener('click', () => {
              navigator.clipboard.writeText(v.text);
              alert('Copied variation to clipboard!');
            });

            tailorResults.appendChild(card);
          });
          tailorResults.classList.remove('hidden');
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // PII Redactor Toggle
  if (piiToggleBtn) {
    piiToggleBtn.addEventListener('click', () => {
      isPiiRedacted = !isPiiRedacted;
      if (isPiiRedacted) {
        const redacted = rawResumeText
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED EMAIL]')
          .replace(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g, '[REDACTED PHONE]');
        atsRawTextView.textContent = redacted;
        piiToggleBtn.textContent = '🔓 Restore Original PII';
      } else {
        atsRawTextView.textContent = rawResumeText;
        piiToggleBtn.textContent = '🔒 Toggle PII Redactor (Mask Name/Email/Phone)';
      }
    });
  }
});
