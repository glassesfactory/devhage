<app-header>
  <header class="header">
    <div class="header-logo-container">
      <h1>
        <a href="/" class="header-logo">devhage</a>
      </h1>
    </div>
  </header>
  <style>
    :scope {
      display: block;
    }

    .header-logo {
      font-size: 42px;
      text-align: center;
      background-image: url('/assets/images/logo.svg');
      background-repeat: no-repeat;
      background-size: 320px 320px;
      background-position: 3.5% 0;
      height: 0;
      padding-top: 320px;
      overflow: hidden;
      display: block
    }

    @media screen and (max-width: 769px) {
      .header-logo {
        font-size: 24px;
      }
    }
  </style>
</app-header>
