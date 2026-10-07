import { EmptyState } from '../../components/EmptyState';

/** 커뮤니티는 MVP 범위 밖이라 자리만 만들어 뒀어요. */
export function CommunityTab() {
  return (
    <EmptyState
      title="커뮤니티는 준비 중이에요"
      description="이 기업에 관심 있는 사람들과 생각을 나누는 공간을 준비하고 있어요."
    />
  );
}
