import React from 'react';
import {createRoot} from 'react-dom/client';
import HomePage from '../../app/page';
import {AppearanceControl} from '../../components/appearance-control';
import {CoHostRecoveryAgentV3} from '../../components/cohost-recovery-agent-v3';
import {NativeShell} from './native-shell';
import '../../app/globals.css';import '../../app/quick-draw.css';import '../../app/people-bingo.css';import '../../app/room-qr.css';import '../../app/host-moderation.css';import '../../app/cohost-recovery.css';import '../../app/accessibility.css';import '../../app/appearance.css';import './mobile.css';
const root=document.getElementById('root');if(!root)throw new Error('Mobile app root is missing.');createRoot(root).render(<React.StrictMode><NativeShell><HomePage/><AppearanceControl/><CoHostRecoveryAgentV3/></NativeShell></React.StrictMode>);
