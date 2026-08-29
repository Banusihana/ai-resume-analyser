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

  // Hiring Jobs Grid
  const jobsGrid = document.getElementById('jobs-grid');

  // Courses & Elevation Grid
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

  // Interview Elements
  const interviewQuestionsList = document.getElementById('interview-questions-list');

  // ATS Raw Text Elements
  const atsRawTextView = document.getElementById('ats-raw-text-view');
  const piiToggleBtn = document.getElementById('pii-toggle-btn');

  const resetBtn = document.getElementById('reset-btn');

  let rawResumeText = "";
  let isPiiRedacted = false;

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
      dzFilename.textContent = `Selected: ${files[0].name}`;
    }
  });

  resumeInput.addEventListener('change', () => {
    if (resumeInput.files.length > 0) {
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
      nameMismatchText.textContent = data.name_verification.warning;
      nameMismatchCard.classList.remove('hidden');
    } else {
      nameMismatchCard.classList.add('hidden');
    }

    // 1. Verdict
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
        
        let priorityClass = 'priority-interest';
        if (course.priority_label && course.priority_label.includes('MUST WORK')) {
          priorityClass = 'priority-must-work';
        } else if (course.priority_label && course.priority_label.includes('PRACTICE')) {
          priorityClass = 'priority-practice';
        }

        card.innerHTML = `
          <div>
            <div class="course-card-top">
              <span class="course-badge ${course.badge}">${course.provider}</span>
              <span class="course-priority-tag ${priorityClass}">${course.priority_label || 'RECOMMENDED'}</span>
            </div>
            <h4>${course.title}</h4>
            <p class="course-meta">Target Skill: <strong>${course.target_skill}</strong> &middot; Duration: ${course.duration}</p>
            <p class="course-reason">💡 ${course.reason || 'Upgrade this skill to elevate your resume grade.'}</p>
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

    // Interview Questions
    interviewQuestionsList.innerHTML = '';
    if (data.interview_questions) {
      data.interview_questions.forEach(q => {
        const card = document.createElement('div');
        card.className = 'interview-question-card';
        card.innerHTML = `<div class="q-cat">${q.category}</div><h4 class="q-text">${q.question}</h4><p class="q-intent"><strong>Interviewer Intent:</strong> ${q.intent}</p><p class="q-tip">💡 <strong>Response Tip:</strong> ${q.tip}</p>`;
        interviewQuestionsList.appendChild(card);
      });
    }

    // ATS Raw Text
    atsRawTextView.textContent = rawResumeText;

    resultsSec.classList.remove('hidden');
    resultsSec.scrollIntoView({ behavior: 'smooth' });
  }

  // JD Match Submit
  matchJdBtn.addEventListener('click', async () => {
    const jdText = jdInput.value.trim();
    if (!jdText) {
      alert('Please paste a Job Description first.');
      return;
    }

    jdLoading.classList.remove('hidden');
    jdResults.classList.add('hidden');

    try {
      const response = await fetch('/api/match_jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to match JD.');
      }

      jdMatchPct.textContent = `${data.match_percentage}%`;
      jdMatchTitle.textContent = data.match_label;
      jdMatchSummary.textContent = data.summary;

      // Matched Skills
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

      // Missing Skills
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

      // Recommended Keywords
      recommendedKeywordsList.innerHTML = '';
      if (data.recommended_keywords && data.recommended_keywords.length > 0) {
        data.recommended_keywords.forEach(k => {
          const chip = document.createElement('span');
          chip.className = 'chip chip-rec';
          chip.textContent = k;
          recommendedKeywordsList.appendChild(chip);
        });
      }

      // Update Course Recommendations tab for missing skills
      if (data.course_recommendations) {
        coursesGrid.innerHTML = '';
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
              <p class="course-reason">💡 ${course.reason || 'Bridge this skill gap.'}</p>
            </div>
            <a href="${course.url}" target="_blank" class="course-link-btn">Launch ${course.provider} Search &rarr;</a>
          `;
          coursesGrid.appendChild(card);
        });
      }

      jdResults.classList.remove('hidden');
    } catch (err) {
      alert(err.message);
    } finally {
      jdLoading.classList.add('hidden');
    }
  });

  // AI Tailor Submit
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
    } catch (err) {
      alert(err.message);
    }
  });

  // PII Redactor Toggle
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
});
