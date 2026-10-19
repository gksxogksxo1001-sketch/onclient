// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
const DEVICE_STATUS_LABELS = {
  compliant: '보안 기준 충족',
  noncompliant: '보안 기준 미충족',
  unknown: '확인 불가',
};

const SESSION_STATUS_LABELS = {
  active: '활성',
  expired: '만료',
  revoked: '철회됨',
  unknown: '확인 불가',
};

const MODE_LABELS = {
  demo: '예제 자료',
  disconnected: '연결 없음',
  unknown: '확인 불가',
};

function formatDeviceStatus(status) {
  return DEVICE_STATUS_LABELS[status] || '확인 불가';
}

function formatSessionStatus(status) {
  return SESSION_STATUS_LABELS[status] || '확인 불가';
}

function getModeText(mode) {
  return MODE_LABELS[mode] || null;
}

export function createStudentView() {
  return {
    renderIdentity(context = {}) {
      const { me, devices, sessions } = context || {};
      const container = document.createElement('div');
      container.className = 'student-identity-container';

      const mode = me?.mode || devices?.mode || sessions?.mode;
      const modeText = getModeText(mode);

      if (me?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '불러오는 중';
        container.appendChild(loadingEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      if (me?.status === 'error') {
        const errorEl = document.createElement('p');
        errorEl.className = 'student-error';
        const message = me.error?.message ? `연결 실패: ${me.error.message}` : '서버에 연결하지 못했습니다.';
        errorEl.textContent = message;
        container.appendChild(errorEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      if (me?.status === 'ok') {
        const data = me.data || {};
        const user = data.user || {};
        const device = data.device || {};
        const session = data.session || {};

        const dl = document.createElement('dl');
        dl.className = 'identity';

        // 사용자
        const dtUser = document.createElement('dt');
        dtUser.textContent = '사용자';
        const ddUser = document.createElement('dd');
        ddUser.textContent = user.label || user.id || '확인 불가';
        dl.appendChild(dtUser);
        dl.appendChild(ddUser);

        // 기기
        const dtDevice = document.createElement('dt');
        dtDevice.textContent = '기기';
        const ddDevice = document.createElement('dd');
        const deviceName = device.label || device.id || '확인 불가';
        const deviceStatusText = formatDeviceStatus(device.status);
        ddDevice.textContent = `${deviceName} · ${deviceStatusText}`;
        if (device.status === 'noncompliant') {
          ddDevice.className = 'status-warning';
        }
        dl.appendChild(dtDevice);
        dl.appendChild(ddDevice);

        // 세션
        const dtSession = document.createElement('dt');
        dtSession.textContent = '세션';
        const ddSession = document.createElement('dd');
        const sessionId = session.id || '확인 불가';
        const sessionStatusText = formatSessionStatus(session.status);
        ddSession.textContent = `${sessionId} · ${sessionStatusText}`;
        if (session.status === 'expired' || session.status === 'revoked') {
          ddSession.className = 'status-danger';
        }
        dl.appendChild(dtSession);
        dl.appendChild(ddSession);

        container.appendChild(dl);

        if (modeText) {
          const modeBadge = document.createElement('p');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        if (devices?.status === 'error' && devices.error?.message) {
          const devErr = document.createElement('p');
          devErr.className = 'student-error';
          devErr.textContent = `기기 목록 연결 실패: ${devices.error.message}`;
          container.appendChild(devErr);
        }
        if (sessions?.status === 'error' && sessions.error?.message) {
          const sessErr = document.createElement('p');
          sessErr.className = 'student-error';
          sessErr.textContent = `세션 목록 연결 실패: ${sessions.error.message}`;
          container.appendChild(sessErr);
        }

        return container;
      }

      // 기본/알 수 없는 상태인 경우
      const fallback = document.createElement('p');
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
