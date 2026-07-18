const formsService = require('./forms.service');

exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await formsService.getTemplates();
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const template = await formsService.createTemplate(req.body);
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

exports.getForms = async (req, res, next) => {
  try {
    // If the user is an expert, filter forms assigned to them or created by them.
    // Admins see all. We assume req.user is set by authMiddleware.
    let forms = await formsService.getForms();
    
    if (req.user && req.user.role === 'EXPERT') {
      forms = forms.filter(f => f.createdBy === req.user.id || (f.assignedTo && f.assignedTo.some(brc => req.user.assignedBrcs?.includes(brc))));
    }
    
    res.json(forms);
  } catch (err) {
    next(err);
  }
};

exports.createForm = async (req, res, next) => {
  try {
    const formData = {
      ...req.body,
      createdBy: req.user ? req.user.id : 'unknown'
    };
    const form = await formsService.createForm(formData);
    res.status(201).json(form);
  } catch (err) {
    next(err);
  }
};

exports.getFormById = async (req, res, next) => {
  try {
    const form = await formsService.getFormById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    res.json(form);
  } catch (err) {
    next(err);
  }
};

exports.updateForm = async (req, res, next) => {
  try {
    const oldForm = await formsService.getFormById(req.params.id);
    const form = await formsService.updateForm(req.params.id, req.body);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    // Check if assignedTo has changed
    if (req.body.assignedTo && oldForm) {
      const oldAssigned = oldForm.assignedTo || [];
      const newAssigned = form.assignedTo || [];
      const newlyAssigned = newAssigned.filter(brc => !oldAssigned.includes(brc));

      if (newlyAssigned.length > 0) {
        try {
          const { sendFormAssignmentEmail } = require('../../utils/mailer');
          const path = require('path');
          const fs = require('fs');
          // experts.json is at server/data/experts.json
          const expertsPath = path.join(__dirname, '../../../data/experts.json');
          if (fs.existsSync(expertsPath)) {
            const experts = JSON.parse(fs.readFileSync(expertsPath, 'utf8'));
            
            const notifiedEmails = new Set();
            
            experts.forEach(expert => {
              if (expert.role === 'EXPERT' && expert.assignedBrcs) {
                const hasNewBrc = expert.assignedBrcs.some(b => newlyAssigned.includes(b));
                if (hasNewBrc && expert.email && !notifiedEmails.has(expert.email)) {
                  notifiedEmails.add(expert.email);
                  const formLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/portal?form=${form.id}`;
                  sendFormAssignmentEmail(expert.email, expert.name || 'STREAM Expert', form.title || 'New Survey', formLink);
                }
              }
            });
          }
        } catch (err) {
          console.error('Error sending form assignment emails:', err);
        }
      }
    }

    res.json(form);
  } catch (err) {
    next(err);
  }
};

exports.deleteForm = async (req, res, next) => {
  try {
    const success = await formsService.deleteForm(req.params.id);
    if (!success) return res.status(404).json({ message: 'Form not found' });
    res.json({ message: 'Form deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getResponses = async (req, res, next) => {
  try {
    const responses = await formsService.getResponses(req.params.id);
    res.json(responses);
  } catch (err) {
    next(err);
  }
};

exports.submitResponse = async (req, res, next) => {
  try {
    const form = await formsService.getFormById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    if (!form.published) return res.status(400).json({ message: 'Form is not published yet' });

    // Ensure formId and submittedBy are part of the data correctly
    const submitData = {
      formId: req.params.id,
      submittedBy: req.user ? req.user.id : 'anonymous',
      data: req.body
    };
    
    const response = await formsService.submitResponse(submitData);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};
