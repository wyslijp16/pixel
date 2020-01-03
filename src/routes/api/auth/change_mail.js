/*
 * request password change
 */


import type { Request, Response } from 'express';
import Sequelize from 'sequelize';
import mailProvider from '../../../core/mail';

import { validatePassword, validateEMail } from '../../../utils/validation';
import { compareToHash } from '../../../utils/hash';

function validate(email, password) {
  const errors = [];

  const passerror = validatePassword(password);
  if (passerror) errors.push(passerror);
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const errors = validate(email, password);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const current_password = user.regUser.password;
  if (!compareToHash(password, current_password)) {
    res.status(400);
    res.json({
      errors: ['Incorrect password!'],
    });
    return;
  }

  await user.regUser.update({
    email,
    mailVerified: false,
  });

  mailProvider.send_verify_mail(email, user.regUser.name);

  res.json({
    success: true,
  });
};