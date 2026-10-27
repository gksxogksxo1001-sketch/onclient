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
    renderDecision(context = {}) {
      const { status = 'idle', mode, data, error, appId } = context || {};
      const container = document.createElement('div');
      container.className = 'student-decision-container';

      const modeText = getModeText(mode);

      // 1. 요청 전 (idle)
      if (status === 'idle') {
        const idleEl = document.createElement('p');
        idleEl.className = 'state state-empty';
        idleEl.textContent = '앱을 골라 접속을 요청하세요.';
        container.appendChild(idleEl);
        return container;
      }

      // 2. 요청 중 (loading)
      if (status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'state state-loading';
        loadingEl.textContent = '판정 확인 중...';
        container.appendChild(loadingEl);
        return container;
      }

      // 3. 요청 실패 (error) - 거부(deny) 판정이 아님을 명시
      if (status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'decision decision-failed';

        const titleEl = document.createElement('p');
        const errorMsg = error?.message ? `요청 실패: ${error.message}` : '요청 실패: 판정 요청 중 오류가 발생했습니다.';
        titleEl.textContent = errorMsg;
        errorBox.appendChild(titleEl);

        const noticeEl = document.createElement('p');
        noticeEl.className = 'muted';
        noticeEl.textContent = '서버 통신 또는 요청 처리 실패입니다. 정책 기준에 따른 접근 거부(deny) 판정이 아니며, 접속이 허용되지 않았습니다.';
        errorBox.appendChild(noticeEl);

        container.appendChild(errorBox);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 4. 판정 수신 (ok)
      if (status === 'ok') {
        const targetAppId = (data && data.appId) || appId || '확인 불가';
        const rawDecision = data && data.decision;
        const reason = (data && data.reason) || '판정 사유 없음';
        const checkedAt = (data && data.checkedAt) || '확인 시각 없음';

        let decisionLabel = '판정 확인 불가(unknown)';
        let decisionClass = 'decision-unknown';
        let decisionNote = '판정을 확인할 수 없습니다. 접속이 허용되지 않았습니다.';

        if (rawDecision === 'allow') {
          decisionLabel = '접근 허용(allow)';
          decisionClass = 'decision-allow';
          decisionNote = '정책상 접근이 허용되었습니다. (실제 앱 접속 성공을 보장하지는 않습니다.)';
        } else if (rawDecision === 'deny') {
          decisionLabel = '접근 거부(deny)';
          decisionClass = 'decision-deny';
          decisionNote = '정책 기준에 따라 접근이 거부되었습니다.';
        } else if (rawDecision === 'challenge') {
          decisionLabel = '추가 인증 또는 확인 필요(challenge)';
          decisionClass = 'decision-challenge';
          decisionNote = '추가 인증 또는 확인이 필요합니다. (이 앱이 확인 절차를 대신하지 않습니다.)';
        }

        const decisionBox = document.createElement('div');
        decisionBox.className = `decision ${decisionClass}`;

        const headEl = document.createElement('p');
        headEl.textContent = `${decisionLabel} · ${targetAppId}`;
        decisionBox.appendChild(headEl);

        const noteEl = document.createElement('p');
        noteEl.className = 'muted';
        noteEl.textContent = decisionNote;
        decisionBox.appendChild(noteEl);

        container.appendChild(decisionBox);

        // 상세 정보 (대상 앱, 판정 이유, 판정 시각)
        const dl = document.createElement('dl');
        dl.className = 'kv';

        const dtApp = document.createElement('dt');
        dtApp.textContent = '대상 앱';
        const ddApp = document.createElement('dd');
        ddApp.textContent = targetAppId;
        dl.appendChild(dtApp);
        dl.appendChild(ddApp);

        const dtReason = document.createElement('dt');
        dtReason.textContent = '판정 이유';
        const ddReason = document.createElement('dd');
        ddReason.textContent = reason;
        dl.appendChild(dtReason);
        dl.appendChild(ddReason);

        const dtTime = document.createElement('dt');
        dtTime.textContent = '판정 시각';
        const ddTime = document.createElement('dd');
        ddTime.textContent = checkedAt;
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        container.appendChild(dl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        return container;
      }

      // 기본/알 수 없는 상태
      const fallback = document.createElement('p');
      fallback.className = 'state state-empty';
      fallback.textContent = '판정 확인 불가(unknown) · 판정 요청 대기 중 (접속이 허용되지 않았습니다)';
      container.appendChild(fallback);
      return container;
    },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
