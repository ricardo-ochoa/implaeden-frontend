'use client';

import { AppBar, Toolbar } from '@mui/material';
import Image from 'next/image';

export default function Header() {
  return (
      <AppBar position="static" color="transparent" elevation={0} sx={{ marginTop: '16px' }}>
        <Toolbar>
          <Image
            src="../../logo.svg"
            alt="Implaeden Logo"
            width={150}
            height={40}
            className="object-contain"
          />
        </Toolbar>
      </AppBar>
  );
}
