import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';

export default function ActionLink({ children, to, href, variant = 'primary', className = '', ...props }) {
  const classes = `${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} hero-cta ${className}`.trim();
  const content = (
    <>
      <span>{children}</span>
      <ArrowUpRight className="button-arrow" size={19} weight="bold" aria-hidden="true" />
    </>
  );

  if (to) {
    return <Link className={classes} to={to} {...props}>{content}</Link>;
  }

  return <a className={classes} href={href} {...props}>{content}</a>;
}
